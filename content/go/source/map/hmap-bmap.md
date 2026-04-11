---
title: 底层结构（hmap 与 bmap）
aliases: e8f6b0b2-23c3-424d-b657-fc08d752220d
date: 2026-04-10 20:15:00
order: 2
tags:
  - golang
  - source-reading
  - map
---

在 Go 语言中，map 的底层实现是一个哈希表。它的核心结构由两部分组成：用于管理整个 map 状态的控制头 `hmap`，以及用于实际存储键值对的桶 `bmap`。

理解这两个结构是阅读 Go map 源码的基础。

## hmap：控制头

`hmap`（Hash Map）是 map 的头部结构体，它维护了 map 的宏观状态，如元素个数、桶的数量、扩容进度等。当我们传递或赋值一个 map 时，本质上是在传递一个指向 `hmap` 的指针。

```go
type hmap struct {
	count     int 	 // 活跃的元素个数，即 len(map) 的返回值。必须是第一个字段。
	flags     uint8  // 状态标志位（如是否正在被写入、是否正在被迭代等），用于并发检测。
	B         uint8  // 桶数量的以 2 为底的对数。即 map 中有 2^B 个常规桶。
	noverflow uint16 // 溢出桶的近似数量。
	hash0     uint32 // 哈希种子，用于计算 key 的哈希值，引入随机性以防止哈希碰撞攻击。

	buckets    unsafe.Pointer // 指向 2^B 个常规桶组成的数组。当 count==0 时可能为 nil。
	oldbuckets unsafe.Pointer // 扩容期间，指向旧的桶数组（大小通常是 buckets 的一半）。仅在扩容时非 nil。
	nevacuate  uintptr        // 扩容时的迁移进度计数器。小于此值的桶已经完成迁移。

	extra *mapextra // 可选字段，用于优化垃圾回收（GC）或存储空闲的溢出桶。
}
```
### flags

在 `hmap` 里，`flags` 是一个 **位标志（bit flags）**，用来记录这张 map 在运行时的几种互斥/状态信息。具体含义在源码里和常量写在一起：

| 位 | 常量 | 作用 |
|----|------|------|
| 1 | `iterator` | 可能有迭代器正在遍历 **当前** `buckets` |
| 2 | `oldIterator` | 可能有迭代器还在遍历 **扩容前** 的 `oldbuckets` |
| 4 | `hashWriting` | 有 goroutine 正在对 map **写入**（与并发读写的检测有关：未加锁时若同时写会 panic） |
| 8 | `sameSizeGrow` | 当前是一次 **等量扩容**（整理溢出桶等，桶数不变），影响扩容/迁移逻辑 |

因此：**`flags` 不是用来存业务数据的**，而是 runtime 用来协调 **迭代、扩容迁移、并发写检测** 的内部状态；读写 map 时会在这些位上置位/清除（例如 `hashWriting` 的 XOR/`&^=`，迭代时用 `atomic.Or8` 设置 `iterator`/`oldIterator` 等）。

### extra 与 mapextra

`mapextra` 挂在 `hmap.extra` 上，用来放**不是每个 map 都需要**的额外状态；不需要时 `extra` 可以是 `nil`，省一点内存。

```go
// mapextra 存储并非所有 map 都拥有的字段。
type mapextra struct {
	// 如果键和值都不包含指针且可内联，我们将桶类型
	// 标记为不包含指针。这可以避免扫描此类 map。
	// 但是 bmap.overflow 是指针。为了保持溢出桶存活，
	// 我们将所有溢出桶的指针存储在 hmap.extra.overflow 和 hmap.extra.oldoverflow 中。
	// overflow 和 oldoverflow 仅在键和值不包含指针时使用。
	// overflow 存储 hmap.buckets 的溢出桶。
	// oldoverflow 存储 hmap.oldbuckets 的溢出桶。
	// 间接存储允许在 hiter 中存储切片指针。
	overflow    *[]*bmap
	oldoverflow *[]*bmap

	// nextOverflow 指向空闲的溢出桶。
	nextOverflow *bmap
}
```

::: [!tip] `mapextra` 负责在「无指针 key/elem」这类 map 上**既满足 GC 不扫 bucket 的优化，又保证溢出 bucket 和扩容时的旧表溢出块都能被正确追踪**，并顺带支持迭代器与预分配溢出块。
:::

#### 和 GC 的关系（注释里说的核心）

当 **key 和 elem 都不含指针、且内联在 bucket 里**时，编译器会把这种 bucket 标成「**不含指针**」，GC **不会**去扫 bucket 里的每个槽位，减轻扫描负担。

但 `bmap` 里还有 **`overflow` 指针**（挂溢出 bucket 的链表）。若只靠「不扫 bucket」的策略，GC 可能**发现不了**这些溢出块，它们就有被误回收的风险。

所以对这种 map，运行时会**把所有溢出 bucket 的指针**额外记在：

- `overflow`：对应当前 `hmap.buckets` 的溢出链  
- `oldoverflow`：扩容时对应 `hmap.oldbuckets` 的溢出链  

这样即使主 bucket 不被当指针图来扫，**溢出块仍然被明确引用**，不会被 GC 掉。

#### 为什么是 *[]*bmap（指针指向 slice）

注释说：**间接一层**是为了让 `hiter`（`for range map` 用的迭代器）里也能保存**指向同一块 slice 的指针**。迭代过程中迭代器要「托住」这些溢出 bucket，和 `hmap` 共享同一套引用，避免一边遍历一边被回收。

#### nextOverflow

指向**预先留好的、尚未挂到某条链上的溢出 bucket**，插入时若需要新的溢出块，可以优先从这里拿，减少分配路径上的开销。

## bmap：存储桶 (Bucket)

`bmap`（Bucket Map）是实际存储键值对的单元。在源码中，`bmap` 的定义看起来非常简单：

```go
type bmap struct {
	tophash [8]uint8 // 存储每个 key 哈希值的高 8 位
}
```

但实际上，这只是**编译期**的表面结构。

### 运行时的真实结构

为了优化内存对齐，Go 编译器会在编译期间动态重写 `bmap` 的结构。一个 `bmap` 最多只能容纳 **8 个键值对**。它在运行时的真实内存布局类似于：

```go
type bmap struct {
	tophash  [8]uint8       // 8 个 key 哈希值的高 8 位，用于快速比对
	keys     [8]KeyType     // 连续存储 8 个 key
	values   [8]ValueType   // 连续存储 8 个 value
	overflow *bmap          // 指向下一个溢出桶的指针
}
```

### 为什么这样设计？

#### 键值分离存储

注意，`bmap` 并没有采用 `key/value/key/value` 的交替存储方式，而是将所有 key 放在一起，所有 value 放在一起（`k1, k2... k8, v1, v2... v8`）。

这种设计是为了**消除内存对齐带来的填充（Padding）浪费**。例如，对于 `map[int64]int8`，如果交替存储，每个 `int8` 后面都需要填充 7 个字节以对齐 `int64`；而分离存储则可以紧凑排列，节省大量内存。

#### tophash 的作用
   
`tophash` 数组缓存了每个 key 哈希值的高 8 位。在查找时，程序会先比较 `tophash` 是否匹配。如果不匹配，就可以直接跳过，避免了直接比较 key 带来的高昂开销（特别是当 key 是字符串或复杂结构体时）。只有当 `tophash` 相等时，才会去比较真实的 key。

此外，`tophash` 的某些特定值（小于 `minTopHash`）还被用来标记该槽位的状态（如：空闲、已迁移等）。

#### 溢出桶 (Overflow Bucket)
   
由于一个 `bmap` 只能装 8 个键值对，当发生哈希冲突，且同一个桶的元素超过 8 个时，Go 会分配一个新的 `bmap`，并通过 `overflow` 指针将其与当前的桶连接起来，形成一个链表。这种解决哈希冲突的方法属于**链地址法**的变种。