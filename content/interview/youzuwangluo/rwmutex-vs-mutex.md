---
title: 3. 读写锁 (RWMutex) 和 Mutex 区别
aliases: 7075B8EC-261B-4921-BF58-DF945D56163C
date: 2026-03-04 15:00:00
tags: [interview, golang, concurrency, lock]
card: true
order: 3
---

## 问题分析

面试官考察的是对 Go 并发原语 `sync.Mutex`（互斥锁）和 `sync.RWMutex`（读写锁）的理解，特别是它们在**不同读写比例场景**下的性能差异和适用性。核心在于理解“读写分离”的思想。

## 核心解答

### 口语回答

`Mutex` 和 `RWMutex` 的主要区别在于对**读操作**的并发控制。

**Mutex（互斥锁）** 是完全互斥的。无论读还是写，同一时间只能有一个 Goroutine 进入临界区。这就像一个单人卫生间，进去一个人锁上门，其他人不管想干什么都得在外面等。

**RWMutex（读写锁）** 则把读和写分开了。它允许多个 Goroutine 同时**读取**（RLock），但在**写入**（Lock）时是完全互斥的。也就是说，读读不互斥，读写互斥，写写互斥。这就像一个公园，大家可以同时进去看风景（读），但如果要进行维修（写），就必须清场，禁止所有人进入。

**总结**：如果读多写少，用 `RWMutex` 可以极大提高并发性能；如果写操作频繁，或者读写比例差不多，用 `Mutex` 就够了，因为 `RWMutex` 本身也有额外的逻辑开销。

### Key Takeaways

| 特性 | Mutex (互斥锁) | RWMutex (读写锁) |
| :--- | :--- | :--- |
| **并发性** | **完全互斥** (1 个 Goroutine) | **读并发** (N 个读者)，**写互斥** (1 个写者) |
| **锁类型** | `Lock()`, `Unlock()` | `Lock()`/`Unlock()` (写), `RLock()`/`RUnlock()` (读) |
| **性能开销** | 较低 (结构简单) | 较高 (逻辑复杂，维护读者计数) |
| **适用场景** | 写多读少，或读写比例均衡 | **读多写少** (Read-Heavy) |

## 详细解析

### 1. 互斥锁 (sync.Mutex)

`sync.Mutex` 只有两个公开方法：`Lock()` 和 `Unlock()`。它保证在同一时间只有一个 Goroutine 能访问临界区。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	count int
	lock  sync.Mutex
)

func read() {
	lock.Lock()         // 获取锁
	defer lock.Unlock() // 释放锁
	fmt.Println("Read:", count)
	time.Sleep(time.Millisecond) // 模拟耗时
}

func write() {
	lock.Lock()
	defer lock.Unlock()
	count++
	fmt.Println("Write:", count)
	time.Sleep(time.Millisecond)
}
```
*   **缺点**：即使只是读取数据，也会阻塞其他读取者，导致并发能力低下。

### 2. 读写锁 (sync.RWMutex)

`sync.RWMutex` 提供了两组方法：
*   **写锁**: `Lock()` / `Unlock()`。行为与 Mutex 一致，完全互斥。
*   **读锁**: `RLock()` / `RUnlock()`。允许多个读者同时持有读锁，只要没有写者持有（或请求）写锁。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	countRW int
	rwLock  sync.RWMutex
)

func readRW() {
	rwLock.RLock()         // 获取读锁
	defer rwLock.RUnlock() // 释放读锁
	fmt.Println("Read:", countRW)
	time.Sleep(time.Millisecond)
}

func writeRW() {
	rwLock.Lock()         // 获取写锁
	defer rwLock.Unlock() // 释放写锁
	countRW++
	fmt.Println("Write:", countRW)
	time.Sleep(time.Millisecond)
}
```

### 3. 写优先 (Writer Priority)

为了防止**写饥饿**（Writer Starvation），Go 的 `RWMutex` 设计上倾向于**写优先**。
当一个写者请求锁（调用 `Lock()`）时，它会阻塞后续的读者请求（调用 `RLock()`），即使当前的读锁还没有释放。一旦现有的读者全部释放锁，写者就会立即获得锁。这避免了源源不断的读者导致写者永远无法获取锁的情况。

## 扩展知识

### 1. 性能对比与开销
`RWMutex` 内部实现比 `Mutex` 复杂（包含互斥锁、读者计数、信号量等），因此单次操作的开销比 `Mutex` 大。
*   **读多写少**（如 100:1）：`RWMutex` 优势明显。
*   **读写相当**：`Mutex` 性能可能更好。

### 2. 常见陷阱
*   **不可复制**：`sync.Mutex` 和 `sync.RWMutex` 都是不可复制的结构体。如果通过值传递（Value Pass），会复制锁的状态，导致死锁或失效。建议使用指针或作为结构体字段。
*   **重入导致死锁**：
    *   持有读锁时，尝试获取写锁 -> 阻塞（等待读锁释放） -> 死锁。
    *   持有写锁时，尝试获取读锁 -> 成功（但在 Go 标准库实现中，通常不建议重入，容易逻辑混乱）。

```go
// 死锁示例
func deadlock() {
    var rw sync.RWMutex
    rw.RLock()
    // ... 某些逻辑 ...
    rw.Lock() // 死锁！Lock 会等待 RLock 释放，但 RLock 也在等待 Lock 完成（在同一个 goroutine 中）
    rw.Unlock()
    rw.RUnlock()
}
```
