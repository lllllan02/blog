---
title: Channel 会在什么情况下引发 panic？
aliases: 6c34d43c-c806-4e65-8b39-911680685106
date: 2026-04-09 21:18:51
card: true
order:
tags: 
  - golang
  - channel
  - panic
---

> **面试官**：请问 Go 语言中 Channel 会在什么情况下引发 panic？

## 面试回答

“在 Go 语言中，操作 Channel 引发 panic 主要有三种情况：

第一种是**关闭一个 nil 的 channel**。如果我们声明了一个 channel 但没有用 `make` 初始化它，直接调用 `close` 就会引发 panic。

第二种是**关闭一个已经关闭的 channel**。Channel 的关闭操作是不可逆的，如果对同一个 channel 执行多次 `close` 操作，除了第一次成功，后续的都会直接 panic。

第三种是**向一个已经关闭的 channel 发送数据**。当 channel 关闭后，它就不能再接收新的数据了，如果强行向其发送数据，也会引发 panic。

总结来说，这三种情况都和 channel 的关闭状态有关：关 nil、重复关、向已关的发数据。在实际开发中，我们通常遵循<u>‘谁发送、谁关闭’</u>的原则，并且只在发送方确认不再发送数据时才关闭 channel，以此来避免这些 panic。”

## 系统讲解

### 核心总结

对 Channel 的不同操作在不同状态下的表现如下表所示：

| 操作 | nil channel | 正常 channel | 已关闭 channel |
| :--- | :--- | :--- | :--- |
| **接收 (`<-ch`)** | 阻塞 | 成功接收数据或阻塞 | 读完数据后返回零值和 `false` |
| **发送 (`ch <-`)** | 阻塞 | 成功发送数据或阻塞 | **Panic** |
| **关闭 (`close`)** | **Panic** | 成功关闭 | **Panic** |

### 代码示例

#### 1. 关闭 nil channel

```go
func panicCloseNil() {
    var ch chan int // 声明但未初始化，此时 ch 为 nil
    close(ch)       // panic: close of nil channel
}
```

#### 2. 重复关闭 channel

```go
func panicCloseClosed() {
    ch := make(chan int)
    close(ch)
    close(ch) // panic: close of closed channel
}
```

#### 3. 向已关闭的 channel 发送数据

```go
func panicSendClosed() {
    ch := make(chan int, 1)
    close(ch)
    ch <- 1 // panic: send on closed channel
}
```

### 亮点与深度

#### 底层原理

在 Go 的 runtime 源码中（`src/runtime/chan.go`），这些 panic 都有明确的检查逻辑：

1.  **`closechan` 函数**：
    *   首先检查 `c == nil`，如果是，直接抛出 `panic(plainError("close of nil channel"))`。
    *   接着检查 `c.closed != 0`，如果是，说明已经关闭，抛出 `panic(plainError("close of closed channel"))`。
2.  **`chansend` 函数**：
    *   在加锁后，首先检查 `c.closed != 0`，如果是，直接解锁并抛出 `panic(plainError("send on closed channel"))`。

#### 最佳实践：如何优雅地关闭 Channel？

为了避免上述 panic，Go 社区总结了关闭 Channel 的最佳实践：
1.  **不要在接收端关闭 channel**：因为接收端无法知道发送端是否还会继续发送数据。
2.  **不要关闭有多个并发发送者的 channel**：如果有多个 goroutine 在向同一个 channel 发送数据，其中一个关闭了 channel，其他 goroutine 再发送就会 panic。
3.  **遵循“谁发送，谁关闭”原则**：
    *   **1 个发送者，多个接收者**：发送者发送完毕后直接关闭 channel。
    *   **多个发送者，1 个接收者**：接收者通过一个额外的信号 channel 通知发送者停止发送，发送者收到信号后退出，不主动关闭数据 channel（让垃圾回收器回收）。
    *   **多个发送者，多个接收者**：引入一个中间协调者（如 `context` 或额外的信号 channel）来广播关闭信号，所有发送者收到信号后停止发送。

#### 常见追问

**追问：从一个已经关闭的 channel 接收数据会怎样？**

从已关闭的 channel 接收数据**不会 panic**。
*   如果 channel 缓冲区中还有未读取的数据，会继续正常读取。
*   如果缓冲区为空，会立即返回该类型的**零值**。
可以通过第二个返回值（ok-idiom）来判断 channel 是否已关闭且数据已读完：
```go
val, ok := <-ch
if !ok {
    // channel 已关闭且缓冲区为空
}
```