---
title: Go sync.Map：场景与底层机制深度解析
aliases: 7d3e5a1b-4f9c-4a3d-9e2c-8b1a2f3d4e5f
date: 2026-02-08 14:30:00
tags:
  - golang
  - sync
---

> 原文：[Go sync.Map: The Right Tool for the Right Job](https://victoriametrics.com/blog/go-sync-map)

## TL;DR

`sync.Map` 通过**读写分离**（`read` 层和 `dirty` 层）以及**原子操作**，专门优化了“**读多写少**”或“**多 Goroutine 操作不相交键集**”的场景。它利用双图机制减少了锁的竞争，但在频繁写入时会因为复杂的维护逻辑（如数据复制、锁竞争）导致性能下降。

## 1. 核心数据结构

`sync.Map` 的高性能源于其精巧的结构设计：

```go
type Map struct {
	mu Mutex
	// read 包含可以安全并发访问的部分（通过 atomic.Pointer）
	read atomic.Pointer[readOnly]
	// dirty 包含需要加锁访问的部分，存储新写入或待提升的数据
	dirty map[any]*entry
	// misses 记录 read 未命中而穿透到 dirty 的次数
	misses int
}

type readOnly struct {
	m       map[any]*entry
	amended bool // 如果 dirty 中包含 read 中没有的 key，则为 true
}

type entry struct {
	// p 指向实际的值。有三种状态：正常值、nil（已删除）、expunged（已抹除）
	p atomic.Pointer[any]
}
```


## 2. 深入底层原理

### 2.1 读操作（Load）：双图查找与穿透计数
当调用 `Load(key)` 时：
1.  **第一路径（无锁）**：首先检查 `read`。由于 `read` 是原子的，这一步非常快且不涉及锁。
2.  **第二路径（加锁）**：如果在 `read` 中没找到，且 `amended` 为 true（意味着 `dirty` 有新数据）：
    *   获取互斥锁 `mu`。
    *   **二次检查**：再次检查 `read`（防止在加锁期间数据被提升到了 `read`）。
    *   如果还是没找到，去 `dirty` 中查找。
    *   **穿透计数（Misses）**：无论是否在 `dirty` 中找到，都会执行 `missLocked()`。
3.  **提升（Promotion）**：当 `misses` 计数达到 `len(dirty)` 时，系统认为 `read` 太旧了，于是将 `dirty` 直接提升为 `read`，并将 `dirty` 置为 `nil`，`misses` 清零。

### 2.2 写操作（Store）：状态机转换
写入一个键值对时，情况较为复杂：
1.  **更新已存在的键**：如果键在 `read` 中，且未被标记为 `expunged`，则尝试通过 `CAS` 直接更新 `entry.p`。这是最理想的无锁路径。
2.  **加锁处理**：
    *   **复活（Revival）**：如果键在 `read` 中但被标记为 `expunged`，说明它之前被删除了且 `dirty` 已经重建过。此时需要先在 `dirty` 中重新关联该键，再更新值。
    *   **更新 dirty**：如果键只在 `dirty` 中，直接更新。
    *   **新键写入**：如果是一个全新的键，将其写入 `dirty`。如果此时 `dirty` 为 `nil`（刚发生过提升），则会触发 `dirtyLocked()`。

::: [!important] 关键点：dirty 的延迟初始化
当写入新键且 `dirty` 为 `nil` 时，`sync.Map` 会遍历当前的 `read`，将所有**非删除**的键值对复制到新创建的 `dirty` 中。在这个过程中，所有被标记为 `nil` 的删除键都会被转换为 `expunged` 状态。
:::

### 2.3 删除操作（Delete）：延迟清理
1.  如果键在 `read` 中，直接通过 `CAS` 将 `entry.p` 置为 `nil`。这只是**逻辑删除**。
2.  如果键不在 `read` 中且 `amended` 为 true，则加锁从 `dirty` 中物理删除（使用原生 `delete` 函数）。

## 3. 深度解析：Expunged 状态

`expunged` 是 `sync.Map` 中最难理解但也最重要的概念。

### 为什么需要 expunged？
在 `sync.Map` 中，键的删除有两种状态：
*   **nil 状态**：键在 `read` 和 `dirty` 中都存在，但值被标记为已删除。
*   **expunged 状态**：键只存在于 `read` 中，不存在于 `dirty` 中。

### 状态流转逻辑：
1.  **标记**：当 `dirty` 因为新键写入而从 `read` 重建时，`read` 中所有 `p == nil` 的条目都会被标记为 `expunged`，且**不会**被复制到新 `dirty` 中。
2.  **清理**：当下次 `dirty` 提升为 `read` 时，这些 `expunged` 的条目会随着旧 `read` 的销毁而彻底消失，从而实现内存回收。
3.  **意义**：这种机制保证了 `dirty` 始终是 `read` 的一个“干净”的超集，同时也避免了在每次删除时都去操作加锁的 `dirty`。

## 4. 性能权衡与最佳实践

### 为什么频繁写入性能差？
*   **锁竞争**：新键写入必须操作 `dirty`，需要加锁。
*   **数据翻倍**：在 `dirty` 重建时，需要遍历并复制整个 `read`，这在 Map 很大时开销巨大。
*   **间接寻址**：所有值都通过 `entry` 结构体进行二次寻址，增加了内存开销和 GC 压力。

### 最佳实践建议：
*   **读写比**：只有当读操作远多于写操作（如 90% 以上是读）时，才考虑 `sync.Map`。
*   **不相交键集**：如果多个 Goroutine 倾向于操作完全不同的 Key，`sync.Map` 的表现也会很好。
*   **固定集合**：如果你的 Key 集合是相对固定的（例如配置项缓存），`sync.Map` 是完美的选择。
*   **监控内存**：由于其延迟清理机制，如果只写不读，内存可能会持续膨胀。

## 5. 关键术语对照

| 英文术语 | 中文解释 | 作用 |
| :--- | :--- | :--- |
| **readOnly** | 只读层 | 提供无锁的原子读取路径。 |
| **dirty** | 脏数据层 | 存储新数据，作为提升的候选。 |
| **amended** | 修正标记 | 标识 `dirty` 是否包含 `read` 缺失的数据。 |
| **misses** | 未命中计数 | 决定何时将 `dirty` 提升。 |
| **expunged** | 抹除状态 | 标记已删除且不属于 `dirty` 的条目。 |
| **promotion** | 提升 | 将 `dirty` 转换为 `read` 以优化后续读取。 |
