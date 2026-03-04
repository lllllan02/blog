---
title: 10. Sync.WaitGroup 是怎么用的
aliases: b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e
date: 2026-03-04 16:41:04
tags: [interview, go, concurrency, sync]
card: true
order: 10
---

## 问题分析

面试官考察 `sync.WaitGroup` 通常有两个目的：
1.  **基础考察**：看你是否掌握 Go 语言中最基本的并发任务同步机制，能否正确编写并发代码。
2.  **避坑能力**：看你是否知道 `WaitGroup` 的常见陷阱，比如在哪里调用 `Add`，是否知道它是值类型（不能直接拷贝）。

## 核心解答

### 口语回答

“`sync.WaitGroup` 是 Go 语言中用于等待一组 Goroutine 执行完成的并发原语。它的使用非常简单，遵循‘三部曲’原则：

第一步是 **Add**，在启动 Goroutine **之前**调用 `wg.Add(delta)`，设置需要等待的 Goroutine 数量。
第二步是 **Done**，在每个 Goroutine 执行结束时（通常配合 `defer`）调用 `wg.Done()`，表示该任务已完成，内部计数器减一。
第三步是 **Wait**，在主 Goroutine 中调用 `wg.Wait()`，它会阻塞当前 Goroutine，直到内部计数器归零。

这里有几个关键点需要注意：一定要在启动 Goroutine 之前 `Add`，否则可能导致 `Wait` 直接返回；另外 `WaitGroup` 是值类型，传递给函数时必须传指针，否则会发生死锁。”

### 核心结论 (Key Takeaways)

*   **作用**: 等待一组 Goroutine 执行结束。
*   **核心方法**:
    *   `Add(delta int)`: 增加（或减少）计数器。
    *   `Done()`: 等同于 `Add(-1)`。
    *   `Wait()`: 阻塞直到计数器变为 0。
*   **最佳实践**:
    *   `Add` 必须在 `go` 关键字之前调用。
    *   `Done` 建议在 Goroutine 内部使用 `defer wg.Done()` 确保执行。
    *   `WaitGroup` 是**值类型**，禁止值拷贝（函数传参需传指针）。

## 详细解析

### 1. 基本用法示例

这是最标准的用法，演示了如何并发抓取多个 URL。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var wg sync.WaitGroup
	urls := []string{
		"http://www.google.com",
		"http://www.baidu.com",
		"http://www.github.com",
	}

	for _, url := range urls {
		// 1. Add: 在启动 Goroutine 前增加计数
		wg.Add(1)
		
		go func(u string) {
			// 2. Done: 任务完成后减少计数，推荐使用 defer
			defer wg.Done()
			
			// 模拟耗时操作
			fmt.Printf("Fetching %s...\n", u)
			time.Sleep(time.Second)
			fmt.Printf("Done %s\n", u)
		}(url)
	}

	// 3. Wait: 阻塞等待所有任务完成
	fmt.Println("Waiting for all requests...")
	wg.Wait()
	fmt.Println("All done!")
}
```

### 2. 常见陷阱 (Pitfalls)

#### 陷阱一：Add 在 Goroutine 内部调用
如果在 `go func` 内部调用 `Add`，主 Goroutine 可能在子 Goroutine 还没来得及执行 `Add` 之前就执行到了 `Wait`，因为此时计数器为 0，`Wait` 会直接返回，导致程序过早退出。

```go
// 错误示例
for i := 0; i < 3; i++ {
    go func() {
        wg.Add(1) // 错！可能还没执行到这里，主程已经退出了
        defer wg.Done()
        // ...
    }()
}
wg.Wait()
```

#### 陷阱二：WaitGroup 是值类型（Copy Value）
`sync.WaitGroup` 内部包含状态锁，如果将它作为参数进行**值传递**，会拷贝一个新的 `WaitGroup` 实例。子函数操作的是副本，主函数的 `Wait` 永远等不到计数器归零，导致**死锁 (Deadlock)**。

```go
// 错误示例
func worker(wg sync.WaitGroup) { // 错！这是值拷贝
    defer wg.Done()
    // ...
}

// 正确示例
func worker(wg *sync.WaitGroup) { // 对！传指针
    defer wg.Done()
    // ...
}
```

#### 陷阱三：计数器减为负数
如果 `Done` 的调用次数超过了 `Add` 的数量，或者 `Add` 传入了负数导致计数器变为负数，程序会直接 **Panic**。

### 3. 原理简述

`WaitGroup` 内部维护了一个计数器和一个信号量。
*   `Add` 操作原子地修改计数器。
*   `Wait` 操作会检查计数器是否为 0，如果不为 0，则将当前 Goroutine 加入等待队列并阻塞（通过信号量）。
*   当计数器归零时，会通过信号量唤醒所有等待的 Goroutine。

## 扩展：WaitGroup vs Channel

| 特性 | WaitGroup | Channel |
| :--- | :--- | :--- |
| **主要用途** | 纯粹的任务编排（等待完成） | 数据传递、通信、同步 |
| **数据流向** | 无数据流动 | 有数据流动 |
| **适用场景** | "我需要等这 10 个任务都做完，再做下一步" | "任务 A 做完把结果给任务 B" / 生产者-消费者模型 |
| **复杂度** | 低 | 中等 |

**总结**: 如果只是单纯地等待一组并发任务结束，`WaitGroup` 是最轻量、最语义化的选择。如果涉及到并发任务之间的数据传递或复杂的控制流（如控制最大并发数），Channel 会更合适。
