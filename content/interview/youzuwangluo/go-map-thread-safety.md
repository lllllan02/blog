---
title: 4. Go 的 map 是线程安全？不安全，怎么让多个线程访问安全？
aliases: 24d3330c-ec37-4d66-a602-98540ee06ff6
date: 2026-03-04 15:59:38
tags: [interview, go, map, concurrency]
order: 4
card: true
---

## 问题分析

面试官主要考察以下几点：
1.  **基础知识**：是否知道 Go 原生 map 的并发特性（非线程安全）。
2.  **异常处理**：是否知道并发读写会导致什么后果（Panic）。
3.  **解决方案**：掌握哪些实现并发安全 map 的方案（Mutex, RWMutex, sync.Map）。
4.  **选型能力**：在不同场景下（读多写少、写多读少）如何选择合适的方案。

## 核心解答

### 口语回答

Go 的 map **默认不是线程安全的**。如果在多个 goroutine 中并发读写同一个 map，或者并发写同一个 map，Go 的运行时检测到这种竞争状态会直接 **panic**，报错信息是 `fatal error: concurrent map writes`。

官方之所以这样设计，主要是出于**性能**考虑。因为在大多数使用场景下，map 并不需要并发访问，如果内置了锁机制，会给那些不需要并发安全的场景带来不必要的性能开销。

要实现 map 的线程安全，通常有三种方式：

1.  **使用 `sync.Mutex`（互斥锁）**：这是最直接的方式。封装一个结构体，包含 map 和一个互斥锁。在对 map 进行增删改查之前，先获取锁，操作完释放锁。这种方式不仅写互斥，读也互斥，性能相对较低，但实现简单。
2.  **使用 `sync.RWMutex`（读写锁）**：如果场景是**读多写少**，推荐使用读写锁。读操作加读锁（`RLock`），写操作加写锁（`Lock`）。多个 goroutine 可以同时持有读锁，但写锁是独占的。这样可以大大提高读性能。
3.  **使用 `sync.Map`**：这是 Go 1.9 引入的标准库并发安全 map。它内部使用了两个 map（read 和 dirty）以及原子操作（atomic）来优化**读多写少**且 key 稳定的场景。它的优点是无需手动加锁，缺点是它是弱类型的（key 和 value 都是 `interface{}`），存取需要类型断言，且在写入频繁的场景下性能不如普通 map 加锁。

### 关键点总结

*   **原生 Map**：非线程安全，并发写会 Panic。
*   **sync.Mutex**：读写全互斥，适合写操作频繁或对性能要求不极致的场景。
*   **sync.RWMutex**：读共享，写互斥，适合**读多写少**的场景。
*   **sync.Map**：标准库实现，适合**读多写少**且 Key 集合稳定的场景，无类型安全。

## 详细解析

### 1. 为什么 Map 不安全？

Go 的 map 在扩容（evacuation）期间，会涉及内存地址的迁移。如果此时有并发读取，可能会读到脏数据或无效地址。为了避免难以调试的数据竞争问题，Go 运行时引入了竞争检测机制（`hmap.flags` 中的 `hashWriting` 标志）。当检测到并发写时，直接抛出致命错误。

### 2. 解决方案代码示例

#### 方案一：使用 `sync.Mutex` (互斥锁)

最通用的方案，适用于读写比例均衡或写操作较多的场景。

```go
package main

import (
	"sync"
)

type SafeMap struct {
	mu sync.Mutex
	m  map[string]int
}

func (s *SafeMap) Get(key string) (int, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	val, ok := s.m[key]
	return val, ok
}

func (s *SafeMap) Set(key string, value int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[key] = value
}
```

#### 方案二：使用 `sync.RWMutex` (读写锁)

适用于**读多写少**的场景（如缓存）。

```go
package main

import (
	"sync"
)

type RWSafeMap struct {
	mu sync.RWMutex
	m  map[string]int
}

// Get 使用读锁，允许多个并发读
func (s *RWSafeMap) Get(key string) (int, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	val, ok := s.m[key]
	return val, ok
}

// Set 使用写锁，完全互斥
func (s *RWSafeMap) Set(key string, value int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[key] = value
}
```

#### 方案三：使用 `sync.Map`

Go 1.9+ 标准库提供，开箱即用，但会有类型转换开销。

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var m sync.Map

	// 写入 (Store)
	m.Store("key1", 100)
	m.Store("key2", 200)

	// 读取 (Load)
	if val, ok := m.Load("key1"); ok {
		// 需要类型断言
		fmt.Println("key1:", val.(int))
	}

	// 遍历 (Range)
	m.Range(func(key, value interface{}) bool {
		fmt.Printf("%v: %v\n", key, value)
		return true // 继续遍历
	})

	// 删除 (Delete)
	m.Delete("key1")
}
```

### 3. 方案对比

| 特性 | 原生 Map + Mutex | 原生 Map + RWMutex | sync.Map |
| :--- | :--- | :--- | :--- |
| **线程安全** | 是 | 是 | 是 |
| **底层实现** | 互斥锁 | 读写锁 | Read/Dirty Map + Atomic |
| **适用场景** | 写多读少，或读写均衡 | **读多写少** | **读多写少**，Key 集合稳定（追加少，更新/删除多） |
| **类型安全** | 强类型 | 强类型 | 弱类型 (`interface{}`) |
| **性能** | 一般，高并发下锁竞争严重 | 读性能好，写性能受影响 | 特定场景下读性能极高，写性能较差 |
| **开销** | 锁开销 | 锁开销 | 内部维护两份 Map，内存开销大 |

## 扩展知识

### 分片锁 (Sharding)

在极高并发的写场景下，单一的互斥锁或读写锁会成为瓶颈。此时可以采用**分片锁**（Sharding）技术。

原理是将一个大 Map 拆分成 N 个小 Map（Shard），每个 Shard 拥有独立的锁。根据 Key 的 Hash 值决定数据落在哪个 Shard 上。这样可以将锁的粒度变小，减少锁竞争。

知名的第三方库 `orcaman/concurrent-map` 就采用了这种思想。

```go
// 伪代码概念
type ConcurrentMap []*Shared

type Shared struct {
    items map[string]interface{}
    sync.RWMutex
}

func (m ConcurrentMap) GetShard(key string) *Shared {
    return m[uint(fnv32(key)) % uint(SHARD_COUNT)]
}
```
