---
title: Go sync.Mutex：正常模式与饥饿模式
aliases: c2f5ae40-3686-46b7-896c-bcdf12ae5cc7
date: 2026-02-02 16:29:31
card: false
order: 
tags:
  - golang
  - goroutine
  - 译文
---

> 原文：[Go sync.Mutex: Normal and Starvation Mode](https://victoriametrics.com/blog/go-sync-mutex/)（VictoriaMetrics Blog，2024-08-09）

译文说明: 本文为**压缩翻译/节译**：保留原文的核心结构（为什么需要 Mutex → 结构 → Lock/Unlock 流程 → 正常/饥饿模式），省略导航、插图与扩展阅读列表；代码块与关键字段名尽量保持原样。

## 为什么需要 `sync.Mutex`

当多个 goroutine 并发读写同一份共享数据（例如 `map` 或一个计数器）时，如果没有同步保护，就会出现竞态：读-改-写并不是原子操作，导致更新丢失，甚至触发运行时错误（例如并发读写 `map`）。

一个最常见的例子是计数器递增：`counter++` 会被拆成“读取 → 加一 → 写回”，这三步可能被不同 goroutine 交错执行，从而丢失递增。

![[Pasted image 20260202163433.png]]

使用 `Mutex` 的方式很直接：用 `Lock/Unlock` 把临界区包起来（工程上通常推荐 `defer Unlock()`，确保一定释放锁）。

```go
var counter = 0
var wg sync.WaitGroup
var mutex sync.Mutex

func incrementCounter() {
	mutex.Lock()
	counter++
	mutex.Unlock()
	wg.Done()
}

func main() {
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go incrementCounter()
	}

	wg.Wait()
	fmt.Println(counter)
}
```

## `sync.Mutex` 的内部结构（“解剖”）

Go 的 `sync.Mutex`（内部实现）核心是两个字段：

```go
type Mutex struct {
	state int32
	sema  uint32
}
```

- **`state`**：一个 32-bit 的状态位图（包含若干 flag + 等待者数量）。
- **`sema`**：一个信号量，用来让等待的 goroutine 进入阻塞/被唤醒（由 runtime 内部实现驱动）。

![[Pasted image 20260202163702.png]]

原文给出的 `state` 语义可以概括为：

| 位/区间 | 含义（压缩译） |
| --- | --- |
| bit0 `Locked` | 是否已加锁（1 表示被持有） |
| bit1 `Woken` | 是否已经唤醒过一个等待者（避免重复唤醒造成惊群） |
| bit2 `Starving` | 是否处于饥饿模式 |
| bit3..31 `Waiter` | 等待者计数（高位存储） |

## `Lock`：快路径与慢路径

`Lock()` 有两条路径：

- **快路径**：无竞争时，用 CAS 把 `state` 从 0 改为 `locked`，成功则立即获得锁（该路径通常会被内联，减少调用开销）。
- **慢路径**：CAS 失败说明有人持锁/有等待者，进入更复杂的竞争处理：可能先自旋，再入队阻塞，等待被唤醒后重试。

```go
func (m *Mutex) Lock() {
	// Fast path: grab unlocked mutex.
	if atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked) {
		if race.Enabled {
			race.Acquire(unsafe.Pointer(m))
		}
		return
	}
	// Slow path (outlined so that the fast path can be inlined)
	m.lockSlow()
}
```

### 为什么要自旋（spinning）

慢路径里不会立刻“排队睡觉”，而是先短暂自旋：希望锁在很短时间内释放，从而**避免一次完整的睡眠/唤醒**带来的调度开销。

但自旋会消耗 CPU：如果机器没有多核或竞争形态不适合，自旋会被限制/禁用。原文示意了 runtime 里用于短暂让出/等待的低级实现（例如 `runtime.procyield(30)` 一类的循环）。

### 自旋失败后会发生什么

如果多次自旋仍拿不到锁，goroutine 会：

- 增加等待者计数（进入等待队列）
- 通过信号量进入阻塞
- 被 `Unlock` 唤醒后再来尝试获取锁

## 正常模式 vs 饥饿模式（公平性与吞吐的取舍）

### 正常模式（Normal）

在正常模式下，被唤醒的等待者并不“保证立即拿到锁”，它需要与**新来的 goroutine**竞争。由于新来的 goroutine 往往已经在 CPU 上运行，竞争会偏向“新来者”，从而可能出现：某个等待者反复被唤醒但总是抢不到锁，等待时间出现长尾。

### 饥饿模式（Starvation）

为避免极端情况下的长尾等待，Go 的 `Mutex` 会在满足条件时进入饥饿模式。原文给出的触发条件是：某个等待者获取锁失败并等待超过一个阈值（典型是 **1ms**）。

进入饥饿模式后：

- `Unlock` 更倾向于把锁**直接交接（handoff）给队首等待者**，减少“唤醒后再竞争”的不确定性
- 新来的 goroutine 不再尝试抢锁，而是加入队列尾部等待

退出饥饿模式的条件（原文描述）大意是：当队列变短（自己是最后一个等待者）或等待时间已明显变小（<1ms）时，会切回正常模式以恢复吞吐。

## `Unlock`：快路径与慢路径

`Unlock()` 同样有快/慢路径：

- **快路径**：清掉 `Locked` 位；如果清完后 `state == 0`，说明没有等待者等其他标志位，直接返回。
- **慢路径**：处理“有等待者”的情况，并区分当前是否处于饥饿模式。

原文对慢路径的要点（压缩译）：

- 如果解锁一个未加锁的 `Mutex` 会直接 `fatal("sync: unlock of unlocked mutex")`。
- **正常模式**：在满足条件时，减少等待者计数、设置 `Woken` 位，然后通过 `sema` 唤醒一个等待者，让它去竞争锁。
- **饥饿模式**：更偏向直接 handoff，把“所有权”交给队首等待者（通过 runtime 的信号量 release 实现）。

## 术语表

| 英文 | 中文 |
| --- | --- |
| mutex | 互斥锁 |
| goroutine | goroutine（Go 协程） |
| lock / unlock | 加锁 / 解锁 |
| CAS (Compare-And-Swap) | 比较并交换 |
| fast path / slow path | 快路径 / 慢路径 |
| spinning | 自旋 |
| waiter | 等待者 |
| semaphore (sema) | 信号量 |
| starvation mode | 饥饿模式 |
| normal mode | 正常模式 |
| handoff | 交接（直接把锁交给等待者） |

## 译者注（易混点）

- “饥饿模式更公平”并不等于“严格 FIFO”：它是在高竞争长尾场景下倾向于交接队首等待者，以限制等待时间上界；整体策略仍会在“吞吐 vs 公平”之间动态切换。
- 原文提到 `TryLock`，但本文未展开；面试语境通常关注 `Lock/Unlock` 与两种模式的设计动机即可。

