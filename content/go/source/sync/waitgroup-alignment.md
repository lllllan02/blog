---
title: Go sync.WaitGroup 与内存对齐问题
aliases: f47ac10b-58cc-4372-a567-0e02b2c3d479
date: 2026-02-03 17:03:57
card: false
order: 2
tags:
  - golang
  - goroutine
  - 译文
---

> 原文：[Go sync.WaitGroup and The Alignment Problem](https://victoriametrics.com/blog/go-sync-waitgroup/)（VictoriaMetrics Blog，2024-09-06）

译文说明: 本文为**压缩翻译/节译**：保留原文的核心脉络（WaitGroup 解决了什么问题 → 内部结构 → 内存对齐的历史演进 → Add/Wait 实现原理），省略了部分基础用法的冗长代码示例与客套话。

## 为什么需要 `sync.WaitGroup`

当我们需要将一个大任务拆解为多个并发的小任务（goroutine）时，主 goroutine 需要一种机制来等待所有子任务完成，而不是直接退出。`sync.WaitGroup` 就是为此设计的。

它主要提供三个方法：
- `Add(n)`：增加计数器，表示有 n 个任务开始。
- `Done()`：减少计数器，表示一个任务完成（等同于 `Add(-1)`）。
- `Wait()`：阻塞当前 goroutine，直到计数器归零。

**常见陷阱**：
1. **Add 的时机**：建议在启动 goroutine **之前**调用 `Add`。如果在 goroutine 内部调用 `Add`，可能发生“主 goroutine 运行到了 `Wait` 但子 goroutine 还没来得及 `Add`”的情况，导致无需等待直接返回。
2. **复用问题**：必须保证前一轮的 `Wait` 返回后，才能开始下一轮的 `Add`。

## `sync.WaitGroup` 的内部结构

在 Go 1.20+ 版本中，`WaitGroup` 的结构体定义非常简洁：

```go
type WaitGroup struct {
	noCopy noCopy
	state atomic.Uint64
	sema  uint32
}

type noCopy struct{}
func (*noCopy) Lock()   {}
func (*noCopy) Unlock() {}
```

### 禁止复制（noCopy）

`WaitGroup` 结构体中包含一个 `noCopy` 字段。这个结构体没有任何运行时功能，它的唯一作用是触发 `go vet` 检查。

**为什么不能复制？**
因为 `WaitGroup` 内部维护着状态计数器和信号量。如果复制了结构体（例如按值传递给函数），就相当于复制了状态，导致新旧对象指向不同的计数器，并发控制逻辑会彻底失效。

### 内部状态（state）

`WaitGroup` 的核心状态是一个 64 位的整数（`state`），其中：
- **高 32 位**：Counter（计数器，记录还需要等待多少个 goroutine）。
- **低 32 位**：Waiter（等待者数量，记录有多少个 goroutine 正在阻塞等待）。

此外还有一个 32 位的信号量 `sema` 用于挂起和唤醒 goroutine。

![[Pasted image 20260203172003.png]]

## 内存对齐问题（The Alignment Problem）

### 32 位架构下的挑战

在 64 位架构上，`uint64` 自然是 8 字节对齐的。但在 32 位架构（如 x86, ARM）上，编译器可能只保证 4 字节对齐。
然而，Go 的 `atomic` 包要求：**64 位原子操作数的内存地址必须是 8 字节对齐的**。如果不对齐，程序运行时会 Panic。

为了解决这个问题，Go 的 `WaitGroup` 内部结构经历了多次演进：

![[Pasted image 20260203172029.png]]

### 演进 1：Go 1.5 - 动态偏移

```go
type WaitGroup struct {
	state1 [12]byte // 预留 12 字节
	sema   uint32
}
```

**原理**：12 字节足够容纳一个 8 字节的数据。程序运行时判断 `state1` 的地址：
- 如果地址是 8 字节对齐的，就直接用前 8 个字节。
- 如果不是，就从第 4 个字节开始用（偏移 4 字节后必然对齐）。

**问题**：这种方案虽然解决了对齐问题，但总共占用了 16 字节（12 字节 `state1` + 4 字节 `sema`），其中有 4 个字节是完全浪费的（padding）。

![[Pasted image 20260203173004.png]]

### 演进 2：Go 1.11 - 结构体重排

```go
type WaitGroup struct {
	state1 [3]uint32
}
```

**原理**：使用 3 个 `uint32`（共 12 字节）。运行时动态分配：
- 如果 `state1` 地址对齐，则 `state1[0]` 和 `state1[1]` 拼成 64 位状态，`state1[2]` 做信号量。
- 如果不对齐，则 `state1[0]` 做信号量，`state1[1]` 和 `state1[2]` 拼成 64 位状态。

![[Pasted image 20260203173128.png]]

### 演进 3：Go 1.18 - 针对 64 位优化

```go
type WaitGroup struct {
	noCopy noCopy
	state1 uint64
	state2 uint32
}
```

**原理**：既然绝大多数服务器都是 64 位的，与其每次都做复杂的动态判断，不如针对 64 位系统直接定义 `uint64`。
- **64 位系统**：`state1` 自然对齐，直接用作状态，`state2` 用作信号量。
- **32 位系统**：如果 `state1` 恰好对齐则照旧；否则回退到类似 Go 1.11 的逻辑，将 `state1` 和 `state2` 视为一个 `[3]uint32` 数组进行重排。

![[Pasted image 20260203173533.png]]

### 演进 4：Go 1.20 - 编译器支持（终极方案）

```go
type WaitGroup struct {
	noCopy noCopy
	state atomic.Uint64
	sema  uint32
}
```

**原理**：Go 1.19 引入了 `atomic.Uint64` 类型，并在编译器层面增加了 `align64` 标记。
当结构体包含 `align64` 字段时，编译器会强制该结构体在内存分配时进行 8 字节对齐（即使在 32 位系统上）。这使得代码变得非常干净，不再需要运行时的动态判断技巧。

## 内部实现机制

### Add(delta)

`Add` 操作的核心是原子地更新 `state`。以下是简化后的核心逻辑：

关键点：
-   **原子更新**：`wg.state.Add` 一次性更新了 Counter。
-   **负值 Panic**：`WaitGroup` 不允许计数器减为负数，否则直接 Panic。
-   **唤醒机制**：当 Counter 归零时，循环调用 `runtime_Semrelease` 唤醒所有阻塞在 `sema` 上的 Goroutine。

```go fold="Add"
func (wg *WaitGroup) Add(delta int) {
	// 1. 将 delta 左移 32 位（因为 Counter 在高位）并原子累加到 state
	state := wg.state.Add(uint64(delta) << 32)

	// 2. 拆分 state 为 Counter (v) 和 Waiter (w)
	v := int32(state >> 32)
	w := uint32(state)

	// 3. 负数检测
	if v < 0 {
		panic("sync: negative WaitGroup counter")
	}

	// 4. 并发误用检测：如果 Wait 已经在等待中 (w!=0)，且 Add 又加了正数 (delta>0)，
	// 且更新后的 v == delta（说明之前 v 是 0），这意味着 Add 和 Wait 并发调用了。
	if w != 0 && delta > 0 && v == int32(delta) {
		panic("sync: WaitGroup misuse: Add called concurrently with Wait")
	}

	// 5. 正常返回：如果计数器 > 0 或者没有等待者，直接返回
	if v > 0 || w == 0 {
		return
	}

	// 6. 唤醒逻辑：Counter 归零 (v==0) 且有等待者 (w!=0)
	// 将 state 重置为 0（清除 Waiter 计数）
	wg.state.Store(0)

	// 唤醒所有等待者
	for ; w != 0; w-- {
		runtime_Semrelease(&wg.sema, false, 0)
	}
}
```

### Wait()

`Wait` 是一个自旋 + CAS 的循环，直到 Counter 归零：

关键点：
-   **CAS 循环**：因为可能有多个 Goroutine 同时调用 `Wait`，或者同时有 `Add` 在修改 state，所以使用 CAS (`CompareAndSwap`) 来安全地增加 Waiter 计数。
-   **信号量阻塞**：`runtime_Semacquire` 会将当前 Goroutine 放入信号量队列并挂起，直到被 `Add` 中的 `runtime_Semrelease` 唤醒。

```go fold="Wait"
func (wg *WaitGroup) Wait() {
	for {
		// 1. 获取当前状态
		state := wg.state.Load()
		v := int32(state >> 32) // Counter
		w := uint32(state)      // Waiter

		// 2. 如果 Counter 已经是 0，无需等待，直接返回
		if v == 0 {
			return
		}

		// 3. 尝试将 Waiter 计数 +1
		// 使用 CAS 避免并发竞争，如果失败（说明 state 变了）则重试循环
		if wg.state.CompareAndSwap(state, state+1) {
			// 4. CAS 成功，挂起当前 Goroutine
			runtime_Semacquire(&wg.sema)
			
			// 5. 被唤醒后（正常应该是 Counter 归零时被 Add 唤醒）
			// 简单检查一下状态一致性
			if wg.state.Load() != 0 {
				panic("sync: WaitGroup is reused before previous Wait has returned")
			}
			return
		}
	}
}
```

## 术语表

| 英文 | 中文 | 含义 |
| :--- | :--- | :--- |
| **Alignment** | 内存对齐 | 数据在内存中的起始地址需满足特定倍数（如 8 字节），以满足原子指令要求。 |
| **Atomic Operation** | 原子操作 | 不可中断的操作，保证并发安全，性能优于锁。 |
| **Semaphore** | 信号量 | 用于控制 Goroutine 挂起和唤醒的机制（即 `sema` 字段）。 |
| **CAS** | 比较并交换 | 一种无锁并发原语，用于安全地更新状态。 |
| **Panic** | 恐慌（运行时错误） | Go 中的运行时异常，通常会导致程序崩溃。 |
