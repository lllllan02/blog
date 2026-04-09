---
title: 空 struct{} 有什么用？
aliases: ef9f19d9-8e0a-4080-ae46-6b2c8fed4069
date: 2026-04-09 14:24:52
card: true
order:
tags: [golang, interview]
---

> **面试官**：请问 Golang 中空 `struct{}` 有什么用？

## 面试回答

“在 Go 语言中，空结构体 `struct{}` 最核心的特点是**它不占用任何内存空间**（`unsafe.Sizeof` 返回 0）。基于这个特性，它主要被用于三种场景：

第一种是**实现 Set 集合**。Go 没有内置的 Set 类型，我们通常用 `map[T]struct{}` 来模拟。把元素作为 map 的键，值用空结构体，这样既能利用 map 的哈希查找特性，又不会为值分配额外的内存。

第二种是**作为信号通道（Signal Channel）**。在并发编程中，我们经常需要用 channel 来传递完成、退出等信号，而不需要传递具体的数据。这时候声明一个 `chan struct{}`，不仅语义明确（只发信号），而且在通信时不会产生任何内存开销。

第三种是**仅包含方法的结构体**。有时候我们需要定义一个对象来实现某个接口，但这个对象本身不需要任何状态（字段）。这时候就可以定义一个基于空结构体的类型，把方法挂载在它上面，实现零内存开销的面向对象设计。”

## 系统讲解

空结构体 `struct{}` 是 Go 语言中一个非常特殊的类型，它的宽度（占用内存大小）为 0。

### 核心特性

- **零内存占用**：`unsafe.Sizeof(struct{}{})` 的结果永远是 0。
- **地址相同**：在 Go 的底层实现中，所有大小为 0 的变量都指向同一个特殊的内存地址 `runtime.zerobase`。因此，两个空结构体变量的地址是相同的。

### 典型应用场景

#### 1. 实现 Set 集合

Go 语言标准库没有提供 Set 数据结构。由于 map 的 key 必须是唯一的，通常使用 map 来实现 Set。如果 map 的 value 使用 `bool`，每个键值对会额外占用 1 字节内存；如果使用 `struct{}`，则 value 不占用任何内存。

```go
type Set map[string]struct{}

func main() {
    s := make(Set)
    
    // 添加元素
    s["apple"] = struct{}{}
    
    // 检查元素是否存在
    if _, ok := s["apple"]; ok {
        fmt.Println("apple exists")
    }
}
```

#### 2. 信号通道 (Signal Channel)

在协程之间同步状态或发送通知时，如果只需要知道“事件发生了”，而不需要传递任何具体的数据内容，使用 `chan struct{}` 是最优雅且高效的做法。

```go
func worker(done chan struct{}) {
    fmt.Println("Working...")
    time.Sleep(time.Second)
    fmt.Println("Done")
    
    // 发送完成信号
    done <- struct{}{}
}

func main() {
    done := make(chan struct{})
    go worker(done)
    
    // 阻塞等待信号
    <-done
    fmt.Println("All workers finished")
}
```

*对比：如果使用 `chan bool` 或 `chan int`，每次发送信号都会有额外的内存拷贝和占用，而 `chan struct{}` 是真正的“零成本”通信。*

#### 3. 无状态的对象 (仅包含方法的结构体)

在某些场景下，我们需要一个类型来实现某个接口，但这个类型本身不需要保存任何数据字段，只需要它的方法逻辑。

```go
// 定义一个接口
type Greeter interface {
    Greet()
}

// 定义一个空结构体
type EnglishGreeter struct{}

// 实现接口方法
func (e EnglishGreeter) Greet() {
    fmt.Println("Hello!")
}

func main() {
    var g Greeter = EnglishGreeter{}
    g.Greet()
}
```

### 亮点与深度

#### 底层原理：zerobase

为什么所有空结构体的地址都一样？在 Go 的 runtime 源码中，有一个特殊的全局变量 `zerobase`。当程序尝试分配大小为 0 的内存时（例如 `new(struct{})` 或 `make([]struct{}, 100)`），内存分配器 `mallocgc` 会直接返回 `zerobase` 的地址，从而避免了实际的内存分配开销。

```go
a := new(struct{})
b := new(struct{})
fmt.Println(a == b) // 输出: true (它们都指向 runtime.zerobase)
```

#### 常见追问

**追问：空结构体切片 `[]struct{}` 会占用内存吗？**

切片本身（Slice Header）会占用 24 字节（在 64 位机器上，包含指针、长度、容量各 8 字节）。但是，切片底层的数组**不会占用任何额外的内存**，无论这个切片的容量有多大。它的底层数据指针也会指向 `zerobase`。

```go
s := make([]struct{}, 10000)
fmt.Println(unsafe.Sizeof(s)) // 输出: 24 (Slice Header 的大小)
// 底层数组不分配内存
```