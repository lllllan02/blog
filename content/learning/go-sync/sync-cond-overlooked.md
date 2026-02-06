---
title: Go sync.Cond：最被忽视的同步机制
aliases: b1ce097b-c5a1-4822-8c0f-808122754932
date: 2026-02-06 15:23:21
card: false
order: 4
tags:
  - golang
  - sync
  - goroutine
  - panic
  - 译文
---

> 原文：[Go sync.Cond, the Most Overlooked Sync Mechanism](https://victoriametrics.com/blog/go-sync-cond/)（VictoriaMetrics Blog，2024-09-13）

## 什么是 sync.Cond

`sync.Cond` 是 Go 标准库中的一种同步原语（condition variable / 条件变量），用于让 goroutine **在某个共享状态满足条件之前进入休眠**，并由其他 goroutine 在状态变化时通过 `Signal()` 或 `Broadcast()` 把它们唤醒。

它解决的是<u>“等待共享状态变化”这一类问题，避免用忙等（busy waiting）在循环里消耗 CPU</u>。

![[Pasted image 20260206153713.png]]

- **等待方**：持有锁，循环检查条件，不满足就 `Wait()`；满足则继续执行。
- **通知方**：修改共享状态后 `Signal()`（唤醒一个）或 `Broadcast()`（唤醒所有）。

> 关键点：`sync.Cond` 只是在说“状态可能变了，你醒来再检查一次”，它**不保证**你醒来时条件一定成立，因此等待方必须用 `for` 循环反复检查。

### 我不可以用 channel 吗？

很多场景下 channel 更常用、更“Go 风格”；但当你需要在“唤醒一个/唤醒所有”之间自由选择，并且需要反复广播时，`sync.Cond` 会更贴合。

更关键的是：channel 更偏“传递消息”，而 `sync.Cond` 更偏“共享状态 + 通知”。当多个 goroutine 共同读写一份共享状态时，你往往仍需要 mutex 来保护状态，而 `Cond` 提供的是在同一把锁语境下进行等待/唤醒的机制。

## 如何使用 sync.Cond

### 典型模板

```go
c.L.Lock()
for !condition() {
	c.Wait()
}
// ... 使用满足条件后的共享状态 ...
c.L.Unlock()
```

### Cond.Wait()：必须配合锁与循环

`Wait()` 的语义可以理解为：

- 调用方必须先持有 `c.L`（否则 `Wait()` 内部会 `Unlock()`，导致运行时错误/崩溃）。
- `Wait()` 会在阻塞前 **释放锁**，让其他 goroutine 有机会获得锁并推进状态；
- 被 `Signal()` / `Broadcast()` 唤醒后，`Wait()` 会先 **重新加锁** 再返回；
- 因为“唤醒到真正运行”存在时间窗口，醒来时共享状态可能又被别的 goroutine 改了，所以要用 `for` 循环反复检查条件。

![[Pasted image 20260206153834.png]]

### Cond.Signal() 与 Cond.Broadcast()

- `Signal()`：唤醒**一个**等待者；如果没人等，什么也不做。
- `Broadcast()`：唤醒**所有**等待者；唤醒后谁先运行由调度器决定，顺序不可依赖。

## 内部实现

- **copy checker**：运行时检测 `sync.Cond` 是否被“使用后复制”，一旦发生直接 `panic`；
- **notifyList**：Go runtime 里的“票据（ticket）驱动通知队列”，实现 `Wait/Signal/Broadcast` 的排队与唤醒。

### copyChecker 防止“使用后复制”

在 `sync` 包里，`Cond` 的结构体大致如下（省略无关字段）：

```go
type Cond struct {
	L      Locker
	notify notifyList
	checker copyChecker
}
```

`copyChecker` 的目的：一旦 `Cond` 被第一次使用（例如调用过 `Wait/Signal/Broadcast` 之一），之后如果这个 `Cond` 被按值复制，就让程序直接 `panic("sync.Cond is copied")`。

::: [!tip] 为什么要这么做？
- `Cond` 内部有等待队列等状态；
- “复制”会把这些状态按值复制成两份，两个 `Cond` 看起来相同，但内部状态不再一致；
- 这会导致通知/等待关系错乱，问题极其隐蔽，所以标准库选择“直接崩溃”。
:::

#### 本质：自指针

- `copyChecker` 本质上是一个 `uintptr`（可以存一个地址）。
- 第一次使用时，把“它自己的地址”写进自己；
- 如果对象被复制，那么新副本里 `copyChecker` 的**地址**变了，但它保存的“旧地址值”不会跟着变；
- 再次检查时，发现“存的地址 != 当前地址”，说明发生了复制，于是 `panic`。

实现大致如下：

```go
// copyChecker holds back pointer to itself to detect object copying.
type copyChecker uintptr

func (c *copyChecker) check() {
	if uintptr(*c) != uintptr(unsafe.Pointer(c)) &&
		!atomic.CompareAndSwapUintptr((*uintptr)(c), 0, uintptr(unsafe.Pointer(c))) &&
		uintptr(*c) != uintptr(unsafe.Pointer(c)) {
		panic("sync.Cond is copied")
	}
}
```

#### 用地址一致性来检测复制

1. **第一次判断**：`uintptr(*c) != uintptr(unsafe.Pointer(c))`
	- 若不相等，意味着“保存的地址”和“当前地址”不同，可能是复制了。
	- 但首次使用时 `*c` 可能还是 0（未初始化），这时也会“不相等”，却不代表复制。
2. **CAS 初始化/并发安全检查**：`atomic.CompareAndSwapUintptr(..., 0, 当前地址)`
	- 如果当前值是 0，CAS 成功，把它设置为当前地址，完成初始化；
	- 如果 CAS 失败，说明不是首次使用（或并发下已被初始化），需要进一步确认是否复制。
3. **最后再判断一次**：与第一次同样的比较
- 注意：因为前两步里存在非原子读的窗口，为了避免并发初始化时的竞态误判，需要再做一次检查来“兜底”。

#### 极端并发情况

![[Pasted image 20260206155026.png]]

### notifyList：票据（ticket）驱动的通知队列

除了“锁 + 防复制”，`sync.Cond` 的核心还依赖 runtime 里的一个结构：`notifyList`。

在 `sync` 包中，`notifyList` 的布局（字段与含义）和 runtime 中的版本一致；但要理解行为，需要看 runtime 里的版本：

```go
type notifyList struct {
	wait   atomic.Uint32 // 下一个要发出的 ticket（原子自增）
	notify uint32        // 下一个要通知的 ticket

	lock mutex
	head *sudog
	tail *sudog
}
```

你可以把它理解成：

- 一条等待链表：`head/tail` 指向等待 goroutine 对应的 `sudog` 节点（类似“等待者队列”）。
- 两个不断递增的“票据号”：
  - `wait`：下一张将要发出去的 ticket（哪个 goroutine 先来领号就拿到哪个号，靠原子自增保证唯一性）；
  - `notify`：下一张应该被唤醒的 ticket（Signal/Broadcast 以它为基准推进）。

这种设计的关键目标：**发号不加锁（并发快速领票），入队/出队在锁保护下完成；并且允许“先领号、后入队”这种时序下也不会丢通知。**

![[Pasted image 20260206160342.png]]

#### 1) notifyListAdd()：领票（不加锁）

当一个 goroutine 调 `Cond.Wait()` 时，会先在 runtime 里领票：

```go
func notifyListAdd(l *notifyList) uint32 {
	return l.wait.Add(1) - 1
}
```

- 这是一个原子计数器自增，返回“自增前的值”作为 ticket；
- 多个 goroutine 可以同时领票，互不阻塞；
- 因为“领票”和“真正入等待队列”之间有时间差，所以 ticket 顺序是单调递增的，但等待链表的入队顺序**不保证**与 ticket 顺序一致。

#### 2) notifyListWait()：入队并 park（或直接返回）

领到票后，goroutine 会进入 `notifyListWait(l, t)`：

```go fold="notifyListWait(l, t)"
func notifyListWait(l *notifyList, t uint32) {
	lockWithRank(&l.lock, lockRankNotifyList)

	// 如果这个 ticket 已经通知过了，直接返回
	if less(t, l.notify) {
		unlock(&l.lock)
		return
	}

	// 把自己入队
	s := acquireSudog()
	// ... s.ticket = t, s.g = 当前 goroutine, etc ...

	if l.tail == nil {
		l.head = s
	} else {
		l.tail.next = s
	}
	l.tail = s

	// park 当前 goroutine，并在 park 时释放 l.lock
	goparkunlock(&l.lock, waitReasonSyncCondWait, traceBlockCondWait, 3)

	// ... 被唤醒后继续，最后 releaseSudog(s)
}
```

这段逻辑里有一个非常关键的“防丢通知”判断：

- 如果 `t < l.notify`，说明“你的票号已经被通知范围覆盖了”（即：你应该已经被唤醒/放行了），那么就**不用入队等待**，直接返回继续执行。

::: [!tip]- 为什么需要这个判断？

- 可能出现一种时序：goroutine A 已经领了 ticket，但还没来得及入队；此时另一个 goroutine 调 `Signal()` 把 `notify` 向前推进了；
- 等 A 终于来执行 `notifyListWait()` 时，如果没有这段判断，它会傻乎乎入队并 park，造成“本来已经被通知，却永远睡下去”的问题；
- 有了 `t < notify` 的判断，A 会意识到“我已经错过/被覆盖了”，所以直接返回，不会丢信号。
:::

这也是 `notifyList` 设计里最巧妙、最关键的一点之一。

#### 3) notifyListNotifyOne()：Signal 的核心（推进 notify，再找 ticket 匹配者）

当调用 `Cond.Signal()` 时，runtime 会执行类似逻辑（简化版）：

```go fold="notifyListNotifyOne"
func notifyListNotifyOne(l *notifyList) {
	// 快速路径：如果没有新的等待者，直接返回
	if l.wait.Load() == atomic.Load(&l.notify) {
		return
	}

	lockWithRank(&l.lock, lockRankNotifyList)

	// 加锁后再次确认，避免竞态
	t := l.notify
	if t == l.wait.Load() {
		unlock(&l.lock)
		return
	}

	// 把当前要通知的 ticket 记为 t = notify，然后将 notify 增加到 t+1
	// 表示“这次我已经通知掉 ticket=t 这一位了”
	atomic.Store(&l.notify, t+1)

	// 然后扫描链表，寻找 s.ticket == t 的那个等待者，把它从链表里摘掉并 ready
	for p, s := (*sudog)(nil), l.head; s != nil; p, s = s, s.next {
		if s.ticket == t {
			// 从链表摘除 s
			n := s.next
			if p != nil {
				p.next = n
			} else {
				l.head = n
			}
			if n == nil {
				l.tail = p
			}

			unlock(&l.lock)

			s.next = nil
			readyWithTime(s, 4) // 标记 goroutine ready，让调度器可运行
			return
		}
	}

	unlock(&l.lock)
}
```

逐步解释：

- **fast path**：如果 `wait == notify`，说明没有新的等待者需要通知（发号范围与通知范围一致），直接返回；
- 加锁后再次确认，避免竞态；
- 把当前要通知的 ticket 记为 `t = notify`，然后将 `notify` 增加到 `t+1`（表示“这次我已经通知掉 ticket=t 这一位了”）；
- 然后扫描链表，寻找 `s.ticket == t` 的那个等待者，把它从链表里摘掉并 `ready`。

这里再次体现了“链表顺序不等于 ticket 顺序”的事实：

- 你可能入队顺序是 `ticket: 2 -> 1 -> 3`；
- 但 `notify` 总是按 `0,1,2,3...` 顺序推进；
- 所以 `notifyListNotifyOne` 需要在链表里“找票号匹配的那个”。

原文也指出一个看似奇怪但实际被设计覆盖的边界情况：

- `notifyListNotifyOne` 推进了 `notify`，但扫描链表时**找不到** ticket 为 `t` 的节点；
- 这通常发生在“等待者领号了但还没入队”的时序下；
- 这种情况下不会出错：等该 goroutine 稍后进入 `notifyListWait()` 时，会触发前面提到的 `t < notify` 判断，直接返回，不会被永久阻塞。

#### 4) notifyListNotifyAll()：Broadcast 的核心（清空链表 + 把 notify 推到 wait）

Broadcast 对应的 runtime 逻辑：

```go fold="notifyListNotifyAll"
func notifyListNotifyAll(l *notifyList) {
	// 快速路径：如果没有新的等待者，直接返回
	if l.wait.Load() == atomic.Load(&l.notify) {
		return
	}

	lockWithRank(&l.lock, lockRankNotifyList)
	s := l.head
	l.head = nil
	l.tail = nil

	atomic.Store(&l.notify, l.wait.Load())
	unlock(&l.lock)

	// 把链表里每个等待者都标记为 ready
	for s != nil {
		next := s.next
		s.next = nil
		readyWithTime(s, 4)
		s = next
	}
}
```

解释：

- 同样先做 fast path：若无需通知则直接返回；
- 加锁后把整条等待链表摘下来（`s := head`，然后清空 head/tail）；
- 把 `notify` 一步推进到 `wait`（表示“截至目前所有已领号的 waiter 都应该被认为已经被通知过了”）；
- 解锁后，把链表里每个等待者都标记为 ready。

这里的 `notify = wait` 也同样覆盖了“领号未入队”的情况：即使某个 goroutine 没在链表里，它只要 ticket 小于新的 `notify`，在进入 `notifyListWait` 时就会直接返回，不会丢广播。

### 回到 `Cond.Wait()`：它如何串起这些组件

`Cond.Wait()` 的伪实现（格式化）：

```go
func (c *Cond) Wait() {
	// 检查 Cond 是否被复制
	c.checker.check()

	// 获取 ticket 号
	t := runtime_notifyListAdd(&c.notify)

	// 解锁互斥锁
	c.L.Unlock()

	// 挂起 goroutine 直到被唤醒
	runtime_notifyListWait(&c.notify, t)

	// 重新加锁互斥锁
	c.L.Lock()
}
```

从这个实现可以直接读出几条工程结论：

- `Cond` **禁止使用后复制**（否则会 `panic`）；
- `Wait()` 会在阻塞前 `Unlock()`，所以调用 `Wait()` 前必须已经 `Lock()`；
- `Wait()` 返回前会重新 `Lock()`，所以返回后你仍处于临界区，需要在合适位置 `Unlock()`；
- `Wait/Signal/Broadcast` 的核心排队与唤醒逻辑都在 runtime 的 `notifyList` 中完成（标准库只做“组合与封装”）。

## 术语表（统一译名）

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| condition variable | 条件变量 | 一种“等待条件成立再继续”的同步原语 |
| goroutine | goroutine（Go 协程） | Go 的并发执行单元 |
| signal | 信号 / 唤醒 | 唤醒一个等待者 |
| broadcast | 广播唤醒 | 唤醒所有等待者 |
| ticket | 票据号 / 号牌 | `notifyList` 中用于排序与覆盖通知的编号 |
| notifyList | 通知队列 | runtime 中 `Cond` 的等待/通知数据结构 |
| sudog | sudog | runtime 中表示“等待中的 goroutine”的结构（原文保留该术语） |
| park / ready | 挂起 / 就绪 | 调度器层面的阻塞与可运行状态 |
| CAS | 比较并交换 | 常见的无锁原子更新操作 |
