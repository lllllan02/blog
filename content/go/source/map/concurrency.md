---
title: 并发安全与 flags 字段
aliases: 1e7b9135-2d6a-4952-b91c-81b4f2c9e8d1
date: 2026-04-17 10:00:00
card: false
order: 10
tags: 
  - golang
  - source-reading
  - map
  - concurrency
---

在 Go 语言的日常开发中，我们经常会听到一个警告：“原生的 map 不是并发安全的”。如果在多个 goroutine 中同时对同一个 map 进行读写操作，程序会直接崩溃并抛出 

```go
fatal error: concurrent map read and map write
````

为什么 Go 官方在设计 map 时，不默认加上读写锁（如 `sync.RWMutex`），让它开箱即用地支持并发安全呢？

这其实是一个典型的工程权衡（Trade-off）。在绝大多数场景下，map 仅仅被用于单 goroutine 的局部变量，或者在初始化完成后变成只读状态。如果为每一次读写操作都引入锁的开销，将会极大地拖慢所有单线程场景下的执行效率。因此，Go 团队选择将“并发安全”的责任交给开发者：你需要并发，你就自己加锁，或者使用专门的 `sync.Map`。

为了防止开发者在不知情的情况下写出数据竞争（Data Race）的代码，导致难以排查的诡异 Bug，Go 在 map 的底层实现中加入了一套轻量级的“并发冲突检测”机制。这套机制的核心，就是 `hmap` 结构体中的 `flags` 字段。

## 底层机制：flags 字段与 hashWriting

在 `hmap` 的定义中，有一个 `uint8` 类型的 `flags` 字段。它不仅用于记录 map 的迭代器状态，还被用来标记当前 map 是否正在被写入。

```go
type hmap struct {
    // ... 其他字段
    flags  uint8
    // ...
}

// flags 相关的位掩码常量
const (
    iterator     = 1 // 有迭代器正在遍历 buckets
    oldIterator  = 2 // 有迭代器正在遍历 oldbuckets
    hashWriting  = 4 // 有 goroutine 正在写入 map
    sameSizeGrow = 8 // 当前正在进行等量扩容
)
```

这里的关键是 `hashWriting`（值为 4，即二进制的 `00000100`）。当一个 goroutine 开始对 map 进行写操作（如插入、修改、删除）时，它会将 `flags` 字段的 `hashWriting` 位置为 1。当写操作完成时，再将该位清零。

## 真实案例：源码中的并发检测

让我们看看这套机制在源码中是如何运作的。以插入操作 `mapassign` 为例：

```go
func mapassign(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
    if h == nil {
        panic(plainError("assignment to entry in nil map"))
    }
    // 1. 检查是否已经有其他 goroutine 正在写入
    if h.flags&hashWriting != 0 {
        fatal("concurrent map writes")
    }
    
    // 2. 将当前状态标记为正在写入
    h.flags ^= hashWriting
    
    // ... 执行核心的哈希计算、扩容判断、寻址与插入逻辑 ...
    
    // 3. 再次检查：在当前 goroutine 写入期间，是否有其他 goroutine 介入？
    if h.flags&hashWriting == 0 {
        fatal("concurrent map writes")
    }
    
    // 4. 清除写入标记
    h.flags &^= hashWriting
    // ...
}
```

在读取操作 `mapaccess1` 和 `mapaccess2` 中，同样会进行检查：

```go
func mapaccess1(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
    // ...
    // 如果当前有 goroutine 正在写入，直接抛出 panic
    if h.flags&hashWriting != 0 {
        fatal("concurrent map read and map write")
    }
    // ... 执行查找逻辑 ...
}
```

**启发与思考**：
注意 `mapassign` 中的第 3 步。为什么在写入逻辑执行完毕后，还要再次检查 `h.flags&hashWriting == 0`？

因为如果在当前 goroutine 执行插入逻辑的期间，另一个 goroutine 也调用了 `mapassign`，它可能会在第 2 步执行 `h.flags ^= hashWriting`（异或操作），导致 `hashWriting` 位被意外清零。通过在结尾进行二次校验，Go 能够更严格地捕获这种并发写入的冲突。

## 权衡与取舍 (Trade-offs)

这套基于 `flags` 的检测机制极其轻量，它仅仅涉及位运算，没有任何锁的开销。但我们需要清楚它的局限性：

1. **尽力而为的检测（Best-effort）**：这并不是一个绝对可靠的并发控制机制。由于对 `flags` 的读写本身没有加锁，在极端并发情况下，仍然存在竞态条件导致检测失效的可能。它主要用于在开发和测试阶段“尽早暴露问题”，而不是作为并发安全的保障。
2. **不可恢复的崩溃**：一旦检测到并发读写，抛出的是 `fatal error`，无法通过 `recover` 捕获，程序会直接退出。这是因为并发读写极有可能已经破坏了 map 的底层内存结构，继续运行会导致更不可预测的灾难。

如果你的业务场景确实需要并发读写 map，你有两种标准选择：
- **`sync.RWMutex` + 原生 map**：适用于读写比例均衡，或者对性能要求不是极致苛刻的场景。这是最通用、最容易理解的方案。
- **`sync.Map`**：适用于“读多写少”或者“各个 goroutine 读写不相交的 key”的特定场景。它通过空间换时间（read/dirty 两个 map）和原子操作来优化并发读性能。