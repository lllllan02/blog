---
title: 1. Go 的 channel 有/无缓冲区别
aliases: DA7A3109-FFB3-40CF-B45B-F1B2862697EB
date: 2026-03-04 14:50:00
tags: [interview, golang, concurrency]
card: true
order: 1
---

## 问题分析

面试官考察的是对 Go 语言并发核心 `channel` 的理解，特别是**同步与异步**通信机制的区别。需要回答出缓冲大小对 Goroutine 阻塞行为的影响，以及它们各自的适用场景。

## 核心解答

### 口语回答

Go 的 channel 分为无缓冲和有缓冲两种。

**无缓冲 channel**（`make(chan T)`）的容量是 0。它的特点是**同步通信**，也就是说，发送和接收必须同时准备好，否则先操作的一方会阻塞，直到另一方加入。这就像两个人面对面交易，一手交钱一手交货，必须同时在场。它常用于 Goroutine 之间严格的同步。

**有缓冲 channel**（`make(chan T, n)`）的容量大于 0。它的特点是**异步通信**。发送方只要缓冲区没满，就可以发送而不阻塞；接收方只要缓冲区不空，就可以接收而不阻塞。只有当缓冲区满了，发送方才会阻塞；缓冲区空了，接收方才会阻塞。这就像有一个快递柜，快递员（发送方）把包裹放进去就可以走，不需要等客户（接收方）立刻来取，起到了解耦和削峰填谷的作用。

总结一下，无缓冲侧重于**同步**，有缓冲侧重于**解耦**和**吞吐量**。

### Key Takeaways

| 特性 | 无缓冲 Channel | 有缓冲 Channel |
| :--- | :--- | :--- |
| **创建方式** | `make(chan T)` 或 `make(chan T, 0)` | `make(chan T, capacity)` |
| **容量 (Capacity)** | 0 | > 0 |
| **发送行为** | 阻塞，直到有接收者 | 缓冲区未满时不阻塞，满时阻塞 |
| **接收行为** | 阻塞，直到有发送者 | 缓冲区非空时不阻塞，空时阻塞 |
| **通信模式** | 同步 (Synchronous) | 异步 (Asynchronous) |
| **适用场景** | 强同步、信号传递、保证顺序 | 解耦生产消费、限制并发数、平滑流量 |

## 详细解析

### 1. 无缓冲 Channel (Unbuffered)

无缓冲 channel 本质上是一个**同步点**。

*   **发送**：发送者执行 `ch <- data` 时，如果没有接收者在 `<-ch` 等待，发送者会**阻塞**（挂起），直到有接收者到来。
*   **接收**：接收者执行 `<-ch` 时，如果没有发送者在 `ch <- data` 等待，接收者会**阻塞**，直到有发送者到来。
*   **Happen-Before**：无缓冲 channel 的发送操作**完成**发生在接收操作**完成**之前（实际上是握手同步）。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	// 创建无缓冲 channel
	ch := make(chan int)

	go func() {
		fmt.Println("发送方: 开始发送...")
		ch <- 1 // 阻塞，直到接收方准备好
		fmt.Println("发送方: 发送成功")
	}()

	time.Sleep(1 * time.Second) // 模拟接收方准备耗时
	fmt.Println("接收方: 准备接收")
	val := <-ch
	fmt.Println("接收方: 接收到", val)
}
```

**输出顺序**：
1.  发送方: 开始发送...
2.  (等待 1 秒)
3.  接收方: 准备接收
4.  接收方: 接收到 1
5.  发送方: 发送成功 (发送方解除阻塞)

### 2. 有缓冲 Channel (Buffered)

有缓冲 channel 内部维护了一个环形队列。

*   **发送**：如果缓冲区未满（`len < cap`），将数据复制到缓冲区，发送立即返回。如果缓冲区已满，发送者阻塞。
*   **接收**：如果缓冲区非空（`len > 0`），从缓冲区取走数据，接收立即返回。如果缓冲区为空，接收者阻塞。

```go
package main

import (
	"fmt"
)

func main() {
	// 创建容量为 2 的有缓冲 channel
	ch := make(chan int, 2)

	fmt.Println("发送方: 发送 1")
	ch <- 1 // 不阻塞，缓冲区 len=1
	fmt.Println("发送方: 发送 2")
	ch <- 2 // 不阻塞，缓冲区 len=2 (满)

	fmt.Println("发送方: 尝试发送 3...")
	
	go func() {
		// 只有接收方取走数据，发送方才能解除阻塞
		val := <-ch
		fmt.Println("接收方: 接收到", val)
	}()

	ch <- 3 // 此时缓冲区满，会阻塞，直到上面的 goroutine 取走一个数据
	fmt.Println("发送方: 发送 3 成功")
}
```

## 扩展知识

### 1. `nil` Channel 的行为
无论是读还是写 `nil` channel，都会**永久阻塞**（除非在 `select` 中被 default 或其他 case 处理）。关闭 `nil` channel 会 panic。

### 2. 关闭 Channel (Close)
*   **向已关闭的 channel 发送**：Panic (`send on closed channel`)。
*   **从已关闭的 channel 接收**：
    *   如果缓冲区有数据：正常接收数据，直到为空。
    *   如果缓冲区为空：立即返回零值，不会阻塞。可以通过 `val, ok := <-ch` 中的 `ok` (false) 判断 channel 是否已关闭。

### 3. 常见死锁 (Deadlock)
在同一个 Goroutine 中，向无缓冲 channel 发送数据且没有其他 Goroutine 接收，会导致死锁。

```go
func main() {
    ch := make(chan int)
    ch <- 1 // fatal error: all goroutines are asleep - deadlock!
}
```
