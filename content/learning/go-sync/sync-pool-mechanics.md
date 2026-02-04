---
title: Go sync.Pool 及其底层机制
aliases: f65e93d8-cbb9-4882-af67-76c401bfbd09
date: 2026-02-04 10:00:00
tags:
  - golang
  - gc
order: 3
card: false
---

> [!note] 译者注
> 本文翻译自 VictoriaMetrics 的技术博客 [Go sync.Pool and the Mechanics Behind It](https://victoriametrics.com/blog/go-sync-pool/)。
> 
> 文章深入剖析了 `sync.Pool` 的设计初衷、使用陷阱（如分配陷阱）、底层实现（PMG 模型、本地池、伪共享问题）以及独特的 Victim Cache 清理机制。对于理解 Go 高性能编程和内存优化非常有帮助。文中对“伪共享”和“无锁队列”的讲解尤为精彩。

在 [VictoriaMetrics](https://github.com/VictoriaMetrics/VictoriaMetrics/) 的源码中，我们大量使用了 `sync.Pool`。对于处理临时对象（尤其是字节缓冲区或切片），它简直是天作之合。

标准库中也广泛使用了它。例如在 `encoding/json` 包中：

```go
package json

var encodeStatePool sync.Pool

// An encodeState encodes JSON into a bytes.Buffer.
type encodeState struct {
    bytes.Buffer // accumulated output
    ptrLevel uint
    ptrSeen  map[any]struct{}
}
```

在这里，`sync.Pool` 被用来复用 `*encodeState` 对象，这些对象负责将 JSON 编码处理到 `bytes.Buffer` 中。

我们没有在每次使用后就丢弃这些对象（这会给垃圾回收器增加更多工作），而是将它们存放在池中（`sync.Pool`）。下次我们需要类似对象时，直接从池中获取，而不是从头创建一个新的。

你还会在 `net/http` 包中发现多个 `sync.Pool` 实例，用于优化 I/O 操作：

```go
package http

var (
    bufioReaderPool   sync.Pool
    bufioWriter2kPool sync.Pool
    bufioWriter4kPool sync.Pool
)
```

当服务器读取请求体或写入响应时，它可以快速从这些池中拉取预分配的 reader 或 writer，跳过额外的分配。此外，两个 writer 池 `*bufioWriter2kPool` 和 `*bufioWriter4kPool` 被设置为处理不同的写入需求。

```go
func bufioWriterPool(size int) *sync.Pool {
    switch size {
    case 2 << 10:
        return &bufioWriter2kPool
    case 4 << 10:
        return &bufioWriter4kPool
    }
    return nil
}
```

好了，介绍到此为止。

今天，我们将深入探讨 `sync.Pool` 到底是什么、它的定义、如何使用、底层发生了什么，以及你可能想知道的其他一切。

> 顺便说一句，如果你想要更实用的内容，我们的 Go 专家有一篇很好的文章，展示了我们在 VictoriaMetrics 中如何使用 `sync.Pool`：[Performance optimization techniques in time series databases: sync.Pool for CPU-bound operations](https://victoriametrics.com/blog/tsdb-performance-techniques-sync-pool/)。

## 什么是 sync.Pool？

简单来说，Go 中的 `sync.Pool` 是一个存放临时对象以供后续复用的地方。

但有一点要注意：**你无法控制池中有多少对象保留，而且放入其中的任何东西都可能在没有任何警告的情况下被随时移除**。读到最后一节你会明白原因。

好消息是，池是**线程安全**的，所以多个 Goroutine 可以同时使用它。考虑到它是 `sync` 包的一部分，这并不令人惊讶。

### 为什么要复用对象？

当你有很多 Goroutine 同时运行时，它们通常需要相似的对象。想象一下并发运行多次 `go f()`。

如果每个 Goroutine 都创建自己的对象，内存使用量会迅速增加，这会给垃圾回收器（GC）带来压力，因为它必须在这些对象不再需要时清理它们。

这种情况造成了一个循环：高并发导致高内存使用，进而拖慢垃圾回收器。`sync.Pool` 旨在帮助打破这个循环。

```go
type Object struct {
    Data []byte
}

var pool = sync.Pool{
    New: func() any {
        return &Object{
            Data: make([]byte, 0, 1024),
        }
    },
}
```

要创建一个池，你可以提供一个 `New()` 函数，当池为空时，它会返回一个新的对象。这个函数是可选的，如果你不提供，池在为空时只会返回 `nil`。

在上面的代码片段中，目标是复用 `Object` 结构体实例，特别是它内部的切片。

复用切片有助于减少不必要的增长。例如，如果切片在使用过程中增长到 8192 字节，你可以在将其放回池之前将其长度重置为零。底层数组仍然有 8192 的容量，所以下次你需要它时，这 8192 字节已经准备好被复用了。

```go
func (o *Object) Reset() {
    o.Data = o.Data[:0]
}

func main() {
    testObject := pool.Get().(*Object)
    // do something with testObject
    testObject.Reset()
    pool.Put(testObject)
}
```

流程很清晰：你从池中获取一个对象，使用它，重置它，然后将其放回池中。重置对象可以在放回之前做，也可以在刚从池中取出后做，这不是强制的，但这是一个常见的做法。

如果你不喜欢使用类型断言 `pool.Get().(*Object)`，有几种方法可以避免：

1.  使用专用函数从池中获取对象：

    ```go
    func getObjectFromPool() *Object {
        obj := pool.Get().(*Object)
        return obj
    }
    ```

2.  创建你自己的泛型版 `sync.Pool`：

    ```go
    type Pool[T any] struct {
        sync.Pool
    }

    func (p *Pool[T]) Get() T {
        return p.Pool.Get().(T)
    }

    func (p *Pool[T]) Put(x T) {
        p.Pool.Put(x)
    }

    func NewPool[T any](newF func() T) *Pool[T] {
        return &Pool[T]{
            Pool: sync.Pool{
                New: func() interface{} {
                    return newF()
                },
            },
        }
    }
    ```

泛型包装器为你提供了一种更类型安全的方式来使用池，避免了类型断言。

只需注意，由于额外的间接层，它会增加一点点开销。在大多数情况下，这种开销是微不足道的，但如果你处于对 CPU 高度敏感的环境中，最好运行基准测试看看是否值得。

但等等，还有更多内容。

## sync.Pool 与分配陷阱 (Allocation Trap)

如果你注意到前面的许多例子，包括标准库中的例子，我们在池中存储的通常不是对象本身，而是**对象的指针**。

让我用一个例子来解释原因：

```go
var pool = sync.Pool{
    New: func() any {
        return []byte{}
    },
}

func main() {
    bytes := pool.Get().([]byte)
    // do something with bytes
    _ = bytes
    pool.Put(bytes)
}
```

我们正在使用一个 `[]byte` 的池。通常（虽然不总是），当你将一个**值**传递给接口（`interface{}`/`any`）时，可能会导致该值被放置在堆上。这里也是如此，不仅是切片，任何你传递给 `pool.Put()` 的非指针内容都可能发生这种情况。

如果你使用逃逸分析进行检查：

```bash
// escape analysis
$ go build -gcflags=-m
bytes escapes to heap
```

现在，我不会说我们的变量 `bytes` 移动到了堆上，我会说“bytes 的值通过接口逃逸到了堆上”。

::: [!abstract]- 深度解析：为什么传值会导致逃逸？
`sync.Pool` 的 `Put` 方法签名是 `Put(x any)`。当你传入一个非指针值（如 `[]byte` 结构头、`int` 等）时，Go 运行时需要将这个值包装成一个 `interface{}`。

如果这个值较大或者编译器无法确定其生命周期，为了保证接口对象在 `Put` 函数内部及之后依然有效，编译器可能会在堆上分配一块内存来拷贝这个值，并将接口指向这块堆内存。这就产生了一次额外的内存分配，违背了我们使用 `sync.Pool` 减少分配的初衷。

传递指针（如 `*[]byte` 或 `*Object`）时，接口只需要持有这个指针。指针本身很小，通常不需要额外的堆分配（或者说开销极小）。
:::

要真正理解为什么会发生这种情况，我们需要深入研究逃逸分析的工作原理（我们可能会在另一篇文章中讨论）。但是，如果我们传递一个**指针**给 `pool.Put()`，就没有额外的分配：

```go
var pool = sync.Pool{
    New: func() any {
        return new([]byte)
    },
}

func main() {
    bytes := pool.Get().(*[]byte)
    // do something with bytes
    _ = bytes
    pool.Put(bytes)
}
```

再次运行逃逸分析，你会看到它不再逃逸到堆上。如果你想了解更多，Go 源代码中有[一个例子](https://github.com/golang/go/blob/2580d0e08d5e9f979b943758d3c49877fb2324cb/src/sync/example_pool_test.go#L15)。

## sync.Pool 内部实现

在深入了解 `sync.Pool` 实际如何工作之前，有必要掌握 Go 的 PMG 调度模型的基础知识，这真的是 `sync.Pool` 如此高效的支柱。

有一篇很好的文章通过一些视觉效果分解了 PMG 模型：[PMG models in Go](https://blog.devtrovert.com/p/goroutine-scheduler-revealed-youll)。

如果你今天想偷懒，想要一个简化的总结，我来帮你：

PMG 代表 **P** (Logical Processors, 逻辑处理器)，**M** (Machine Threads, 机器线程)，和 **G** (Goroutines, 协程)。关键点是，每个逻辑处理器 (P) 在任何时候只能有一个机器线程 (M) 在其上运行。而对于一个 Goroutine (G) 要运行，它需要被附加到一个线程 (M) 上。

这归结为 2 个关键点：

1.  如果你有 `n` 个逻辑处理器 (P)，你可以并行运行最多 `n` 个 Goroutine，只要你至少有 `n` 个机器线程 (M) 可用。
2.  在任何时候，只有一个 Goroutine (G) 可以在单个处理器 (P) 上运行。因此，当 P1 忙于处理一个 G 时，没有其他 G 可以在那个 P1 上运行，直到当前的 G 被阻塞、完成或发生其他事情将其释放。

但问题是，Go 中的 `sync.Pool` 不仅仅是一个大池子，它实际上是由几个“本地”池组成的，每个池都绑定到一个特定的处理器上下文（P），Go 的运行时在任何给定时间都在管理这个上下文。

![Local Pools](https://victoriametrics.com/blog/go-sync-pool/sync-pool-locals.webp)

当在一个处理器 (P) 上运行的 Goroutine 需要池中的对象时，它会首先检查自己的 **P-local pool**（P 本地池），然后再去其他地方寻找。

这是一个明智的设计选择，因为这意味着每个逻辑处理器 (P) 都有自己的一套对象可以使用。这减少了 Goroutine 之间的争用，因为一次只有一个 Goroutine 可以访问其 P-local pool。

所以，这个过程超级快，因为不可能有两个 Goroutine 试图同时从同一个本地池中抓取同一个对象。

### 本地池与伪共享问题 (False Sharing)

早些时候，我们提到*“一次只有一个 Goroutine 可以访问 P-local pool”*，但现实要微妙得多。

看下面的图，每个 P-local pool 实际上有两个主要部分：共享池链 (`shared`) 和私有对象 (`private`)。

![Local Pool Structure](https://victoriametrics.com/blog/go-sync-pool/sync-pool-local.webp)

这是 Go 源代码中本地池的定义：

```go
type poolLocalInternal struct {
    private any
    shared  poolChain
}

type poolLocal struct {
    poolLocalInternal
    pad [128 - unsafe.Sizeof(poolLocalInternal{})%128]byte
}
```

`private` 字段存储单个对象，只有拥有此 P-local pool 的 P 才能访问它，我们称之为**私有对象**。

它的设计使得 Goroutine 可以快速抓取一个可复用的对象（即私有对象），而无需处理任何互斥锁或同步技巧。换句话说，只有当前 Goroutine 可以访问它自己的私有对象，没有其他 Goroutine 可以与它竞争。

但如果私有对象不可用，那就是共享池链 (`shared`) 介入的时候了。

> “为什么它会不可用？我以为只有一个 Goroutine 可以获取和放回私有对象。那么，谁是竞争对手？”

好问题。

虽然确实一次只有一个 Goroutine 可以访问 P 的私有对象，但有一个陷阱。如果 Goroutine A 抓取了私有对象，然后被阻塞或抢占，Goroutine B 可能会开始在同一个 P 上运行。当这种情况发生时，Goroutine B 将无法访问私有对象，因为 Goroutine A 仍然拥有它（或者说该位置为空）。

现在，与简单的私有对象不同，共享池链 (`shared`) 要复杂一些。

所以 `Get()` 流程可以简单地想象成这样：

![Get Flow](https://victoriametrics.com/blog/go-sync-pool/sync-pool-get-simple.webp)

*上面的图并不完全准确，因为它没有考虑到 victim pool（受害者池）。*

如果共享池链也是空的，`sync.Pool` 将创建一个新对象（假设你提供了 `New()` 函数）或者直接返回 nil。顺便说一句，共享池内部还有一个 victim 机制，我们将在最后介绍。

> “等等，我看到 P-local pool 中有一个 `pad` 字段。那是怎么回事？”

当你查看 P-local pool 结构时，有一件事会跳出来，那就是这个 `pad` 属性。这是 VictoriaMetrics 的 CTO [Aliaksandr Valialkin](https://x.com/valyala) 在[这个提交](https://go-review.googlesource.com/c/go/+/40918)中调整的：

```go
type poolLocal struct {
    poolLocalInternal
    pad [128 - unsafe.Sizeof(poolLocalInternal{})%128]byte
}
```

这个 `pad` 看起来可能有点奇怪，因为它不增加任何直接的功能，但它实际上是为了防止现代多核处理器上可能出现的一个问题，称为**伪共享 (False Sharing)**。

::: [!abstract]- 深度解析：伪共享 (False Sharing)
要理解为什么这很重要，我们需要深入了解 CPU 如何处理内存和缓存。

现代 CPU 使用称为 **CPU Cache**（缓存）的组件来加速内存访问，这个缓存被划分为称为 **Cache Line**（缓存行）的单元，通常保存 64 或 128 字节的数据。当 CPU 需要访问内存时，它不仅仅是抓取单个字节或字——它会加载整个缓存行。

这意味着，如果两个数据在内存中靠得很近，它们可能会最终位于**同一个缓存行**上，即使它们在逻辑上是分开的。

在 Go 的 `sync.Pool` 的上下文中，每个逻辑处理器 (P) 都有自己的 `poolLocal`，它们存储在一个数组中。如果 `poolLocal` 结构小于缓存行的大小，来自不同 P 的多个 `poolLocal` 实例可能会最终位于同一个缓存行上。

这就是事情可能会出错的地方。如果运行在不同 CPU 核心上的两个 P 试图同时访问它们自己的 `poolLocal`，它们可能会无意中互相干扰。

即使每个 P 只处理它自己的 `poolLocal`，这些结构也可能共享同一个缓存行。

当一个处理器修改缓存行中的某些内容时，**其他处理器缓存中的整个缓存行都会失效**，即使它们正在处理同一行中的不同变量。这会导致严重的性能打击，因为会产生不必要的缓存失效和额外的内存流量。

这就是 `128 - unsafe.Sizeof(poolLocalInternal{})%128` 的用武之地。

它计算需要多少字节来填充 P-local pool，使其总大小是 128 字节的倍数。这种填充有助于确保每个 `poolLocal` 都有自己的缓存行，防止伪共享，并保持运行速度更快、无冲突。
:::

### 池链 (Pool Chain) 与池双端队列 (Pool Dequeue)

`sync.Pool` 中的共享池链由一个名为 `poolChain` 的类型表示。

从名字上看，你可能猜到它是一个双向链表，你是对的。但这里有个转折：这个列表中的每个节点不仅仅是一个可复用的对象。相反，它是另一个称为池双端队列 (`poolDequeue`) 的结构。

```go
type poolChain struct {
    head *poolChainElt
    tail atomic.Pointer[poolChainElt]
}

type poolChainElt struct {
    poolDequeue
    next, prev atomic.Pointer[poolChainElt]
}
```

`poolChain` 的设计非常具有策略性：

当当前的池双端队列（列表头部的那个）变满时，会创建一个新的池双端队列，其大小是前一个的两倍。这个新的、更大的池随后被添加到链中。

如果你看看 `poolChain` 结构体，你会注意到它有两个字段：一个指针 `head *poolChainElt` 和一个原子指针 `tail atomic.Pointer[poolChainElt]`。

这些字段揭示了机制是如何工作的：

*   **生产者**（拥有当前 P-local pool 的 P）只向最近的池双端队列（我们称之为 **head**）添加新项目。由于只有生产者在接触 head，所以不需要锁或任何花哨的同步技巧，所以它非常快。
*   **消费者**（其他 P）从列表 **tail** 处的池双端队列中获取项目。由于多个消费者可能试图同时弹出项目，因此对 tail 的访问使用原子操作进行同步，以保持秩序。

![Pool Chain Mechanism](https://victoriametrics.com/blog/go-sync-pool/sync-pool-shared-pool-chain.webp)

但这里是关键部分：

1.  当 tail 处的池双端队列完全被清空时，它会从列表中移除，下一个排队的池双端队列成为新的 tail。
2.  当 head 处的池双端队列用完项目时，它不会被移除。相反，它留在原地，准备在添加新项目时被重新填充。

现在，让我们看看 `poolDequeue` 是如何定义的。正如“dequeue”（双端队列）这个名字所暗示的，它是一个双端队列。

与只能在后面添加元素并从前面移除元素的常规队列不同，双端队列允许你在前面和后面插入和删除元素。

它的机制实际上与 pool chain 非常相似。它的设计使得一个生产者可以从头部添加或移除项目，而多个消费者可以从尾部获取项目。

```go
type poolDequeue struct {
    headTail atomic.Uint64
    vals []eface
}
```

生产者（即当前的 P）可以将新项目添加到队列的前端或从中获取项目。

同时，消费者只能从队列的尾部获取项目。这个队列是 **Lock-Free（无锁）** 的，这意味着它不使用锁来管理生产者和消费者之间的协调，只使用原子操作。

你可以把这个队列想象成一种**环形缓冲区 (Ring Buffer)**。

::: [!abstract]- 深度解析：环形缓冲区与 headTail 打包
环形缓冲区（或循环缓冲区）是一种数据结构，它使用固定大小的数组以循环方式存储元素。它被称为“环”，因为在某种程度上，缓冲区的末尾绕回到开头，使其看起来像一个圆圈。

在我们要讨论的 pool dequeue 上下文中，`headTail` 字段是一个 64 位整数，它将两个 32 位索引打包成一个值。

*   **tail index** 指向缓冲区中最旧项目的位置，当消费者（如其他 Goroutine）从缓冲区读取时，它们从这里开始并向前移动。
*   **head index** 是下一个数据将被写入的地方。随着新数据的进入，它被放置在这个 head index，然后索引移动到下一个可用槽位。

**为什么要打包？**

通过将 head 和 tail 索引打包成一个 64 位值，代码可以一次性更新两个索引，使操作具有原子性。

这在两个消费者（或一个消费者和一个生产者）试图同时从队列中弹出一个项目时特别有用。CompareAndSwap (CAS) 操作 `d.headTail.CompareAndSwap(ptrs, ptrs2)` 确保只有一个成功。另一个失败并重试，保持有序而无需复杂的锁定。

队列中的实际数据存储在一个名为 `vals` 的循环缓冲区中，其大小必须是 2 的幂。

这种设计选择使得处理队列到达缓冲区末尾时的回绕变得更容易（使用位运算掩码）。这个缓冲区中的每个槽位都是一个 `eface` 值，这是 Go 在底层表示空接口 (`interface{}`) 的方式。
:::

简而言之，pool chain 结合了链表和每个节点的环形缓冲区。当一个 dequeue 填满时，一个新的、更大的 dequeue 被创建并链接到链的头部。这种设置有助于有效地管理大量的对象。

## Pool.Put() 流程

让我们从 `Put()` 流程开始，因为它比 `Get()` 稍微直接一点，而且它与另一个过程有关：将 Goroutine 绑定（Pin）到 P。

当一个 Goroutine 在 `sync.Pool` 上调用 `Put()` 时，它尝试做的第一件事是将对象存储在当前 P 的 P-local pool 的**私有位置**。如果那个私有位置已经被占用，对象就会被推送到**共享池链的头部**。

```go
func (p *Pool) Put(x interface{}) {
    // If the object is nil, it will do nothing
    if x == nil {
        return
    }
    // Pin the current P's P-local pool
    l, _ := p.pin()
    // If the private pool is not there, create it and set the object to it
    if l.private == nil {
        l.private = x
        x = nil
    }
    // If the private object is there, push it to the head of the shared chain
    if x != nil {
        l.shared.pushHead(x)
    }
    // Unpin the current P
    runtime_procUnpin()
}
```

我们还没有谈到 `pin()` 或 `runtime_procUnpin()` 函数，但它们对于 `Get()` 和 `Put()` 操作都很重要，因为它们确保 Goroutine 保持“绑定”到当前的 P。

从 Go 1.14 开始，Go 引入了抢占式调度，这意味着如果一个 Goroutine 在处理器 P 上运行时间过长（通常约为 10ms），运行时可以暂停它，给其他 Goroutine 运行的机会。

这通常有利于保持公平和响应性，但在处理 `sync.Pool` 时可能会导致问题。

`sync.Pool` 中的 `Put()` 和 `Get()` 等操作假设 Goroutine 在整个操作过程中停留在同一个处理器（比如 P1）上。如果 Goroutine 在这些操作中间被抢占，然后在不同的处理器（P2）上恢复，它正在处理的本地数据可能最终来自错误的处理器。

那么，`pin()` 函数做什么呢？

```go
// pin pins the current goroutine to P, disables preemption and
// returns poolLocal pool for the P and the P's id.
// Caller must call runtime_procUnpin() when done with the pool.
func (p *Pool) pin() (*poolLocal, int) { ... }
```

基本上，`pin()` 暂时禁止调度器抢占 Goroutine 的能力，当它正在将对象放入池中时。

尽管它说“将当前 Goroutine 绑定到 P”，但实际发生的是当前线程（M）被锁定到处理器（P），这防止了它被抢占。结果，运行在该线程上的 Goroutine 也不会被抢占。

作为副作用，如果你在运行时更改 `GOMAXPROCS(n)`（控制 P 的数量），`pin()` 还会更新处理器（P）的数量。

**共享池链的处理：**

当你需要向链中添加一个项目时，操作首先检查链的头部。还记得 `head *poolChainElt` 指针吗？那是列表中最近的 pool dequeue。

根据情况，可能会发生以下事情：

1.  如果链的 head buffer 为 `nil`，意味着链中还没有 pool dequeue，则创建一个初始缓冲区大小为 8 的新 pool dequeue。然后将项目放入这个全新的 pool dequeue 中。
2.  如果链的 head buffer 不为 `nil` 且该缓冲区未满，则只需将项目添加到 head 位置的缓冲区中。
3.  如果链的 head buffer 不为 `nil`，但该缓冲区已满（意味着 head index 已经回绕并赶上了 tail index），则创建一个新的 pool dequeue。这个新池的缓冲区大小是当前 head 的**两倍**。项目被放入这个新的 pool dequeue，并且 pool chain 的 head 被更新为指向这个新池。

这就是 `Put()` 流程。这是一个相对简单的过程，因为它不涉及与其他处理器的本地池交互；一切都发生在 pool chain 的当前 head 内。

## sync.Pool.Get() 流程

乍一看，`Get()` 函数似乎与 `Put()` 非常相似。

它首先将当前 Goroutine 绑定到其 P 以防止抢占，然后检查并从其 P-local pool 中抓取私有对象，无需任何同步。如果私有对象不在那里，它会检查共享池链并弹出链的头部。

只有运行在当前 P-local pool 上的 Goroutine 才能访问链的头部，这就是为什么我们使用 `popHead()`：

```go
func (p *Pool) Get() interface{} {
    // Pin the current P's P-local pool
    l, pid := p.pin()
    // Get the private object from the current P-local pool
    x := l.private
    l.private = nil
    // If the private object is not there, pop the head of the shared pool chain
    if x == nil {
        x, _ = l.shared.popHead()
        // Steal from other P's cache
        if x == nil {
            x = p.getSlow(pid)
        }
    }
    runtime_procUnpin()
    // If the object is still not there, create a new object from the factory function
    if x == nil && p.New != nil {
        x = p.New()
    }
    return x
}
```

与 `Put()` 中的 `p.pin()` 不同，这里我们也得到了 `pid`，即当前 Goroutine 正在运行的 P 的 ID。我们需要这个来进行**窃取 (Stealing)** 过程，如果快速路径失败，就会进入这个过程。

**快速路径**是指对象在当前 P 的缓存中可用。但如果那不起作用，意味着私有对象和共享链的头部都是空的，慢速路径 (`getSlow`) 就会接管。

在慢速路径中，我们尝试从其他处理器 (P) 的缓存池中窃取对象。

窃取背后的想法是复用可能闲置在其他处理器缓存中的对象，而不是从头创建新对象。如果另一个 P 在其缓存池中有额外的对象，当前 P 可以抓取这些对象并投入使用。

![Steal Process](https://victoriametrics.com/blog/go-sync-pool/sync-pool-steal.webp)

窃取过程基本上循环遍历所有 P（除了当前的 `pid`），并尝试从每个 P 的共享池链中抓取一个对象：

```go
for i := 0; i < int(size); i++ {
    l := indexLocal(locals, (pid+i+1)%int(size))
    if x, _ := l.shared.popTail(); x != nil {
        return x
    }
}
```

正如我们之前谈到的，在 `poolChain` 中，提供者（当前 P）在头部 push 和 pop，而多个消费者（其他 P）从尾部 pop。

所以，`popTail` 查看链表中的最后一个 pool dequeue，并尝试从该 pool dequeue 的末尾抓取数据。

*   如果它找到数据，窃取成功，数据被返回。
*   如果它在该 pool dequeue 中没有找到任何数据，tail index 增加，并且该 pool dequeue 从链中移除。

这个过程一直持续到它成功窃取一些数据或者在所有 pool chain 中用尽选项。

> “所以如果窃取过程失败，它会使用 `New()` 创建一个新对象吗？”

不完全是。

如果在所有窃取尝试之后，它仍然找不到任何数据，该函数随后尝试从所谓的“**Victim (受害者)**”中获取数据。这是与 `sync.Pool` 如何清理对象有关的一个新概念，我们将在下一节详细介绍 victim 机制。

总结一下 `Get()` 流程：

我们尝试以各种可能的方式抓取对象，如果什么都没找到，它最终使用 `New()` 创建一个新对象。但如果 `New()` 为 nil，那么它只是返回 nil。就这么简单。

现在，在尝试了 victim pool 之后，它被原子地标记为空（尽管并发访问可能仍然从中检索）。随后的 `Get()` 操作将跳过检查 victim cache，直到它再次被填充。

## Victim Pool (受害者池)

尽管 `sync.Pool` 是为了更好地管理资源而构建的，但它并没有给我们开发者直接的工具来清理或管理对象生命周期。相反，`sync.Pool` 在幕后处理清理工作，以避免不受控制的增长，这可能导致内存泄漏。

这种清理发生的主要方式是通过 Go 的垃圾回收器 (GC)。

还记得我们谈论 `pin()` 时吗？事实证明 `pin()` 还有另一个副作用。每当 `sync.Pool` 第一次调用 `pin()`（或通过 `GOMAXPROCS` 更改 P 的数量后），它会被添加到一个名为 `allPools` 的全局切片中：

```go
package sync

var (
    allPoolsMu Mutex

    // allPools is the set of pools that have non-empty primary
    // caches. Protected by either 1) allPoolsMu and pinning or 2)
    // STW.
    allPools []*Pool

    // oldPools is the set of pools that may have non-empty victim
    // caches. Protected by STW.
    oldPools []*Pool
)
```

这个 `allPools []*Pool` 切片跟踪应用程序中所有活动的 `sync.Pool` 实例。

在每个垃圾回收 (GC) 周期开始之前，Go 的运行时会触发一个清理过程，清除 `allPools` 切片。它是这样工作的：

1.  在 GC 启动之前，它调用 `clearPool`，将 `sync.Pool` 中的所有对象（包括私有对象和共享池链）转移到所谓的 **victim area**（受害者区域）。
2.  这些对象不会立即被丢弃，它们暂时保留在这个 victim area 中。
3.  同时，来自上一个 GC 周期的已经在 victim area 中的对象在当前 GC 周期中被完全清除。

或者你可能有兴趣看看源代码：

```go
func poolCleanup() {
    // Drop victim caches from all pools.
    for _, p := range oldPools {
        p.victim = nil
        p.victimSize = 0
    }

    // Move primary cache to victim cache.
    for _, p := range allPools {
        p.victim = p.local
        p.victimSize = p.localSize
        p.local = nil
        p.localSize = 0
    }

    // The pools with non-empty primary caches now have non-empty
    // victim caches and no pools have primary caches.
    oldPools, allPools = allPools, nil
}
```

**为什么我们需要这个 victim 机制？**

使用 victim 机制的原因是为了避免在 GC 周期之后立即突然完全清空池。如果池被一次性清空，可能会导致性能问题，因为任何新的对象请求都需要从头重新创建。所以我们先将对象移动到 victim area，`sync.Pool` 确保有一个缓冲期，对象在被完全丢弃之前仍然可以被复用。

总结一下，`sync.Pool` 中的对象**至少需要 2 个 GC 周期**才能被完全移除。

对于 `GOGC` 值较低的程序（控制 GC 运行频率），这可能是一个问题。如果 `GOGC` 设置得太低，清理过程可能会过快地移除未使用的对象，导致更多的缓存未命中。

> **最后的话**：即使使用了 `sync.Pool`，如果你处理的是极高的并发和缓慢的 GC，你可能会遇到更多的开销。在这种情况下，一个好的解决方案可能是对 `sync.Pool` 的使用实施速率限制。
