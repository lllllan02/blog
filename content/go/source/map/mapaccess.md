---
title: 查找过程（mapaccess）
aliases: 3dccc618-e0d3-4e42-b407-13c207c3dcab
date: 2026-04-11 14:58:49
card: false
order: 5
tags: 
  - golang
  - source-reading
  - map
  - go1.21
---

在 Go 语言中，当我们使用 `v := m[k]` 语法从 map 中读取数据时，编译器在底层会将其转换为对 `runtime.mapaccess1` 函数的调用；而对于 `v, ok := m[k]` 的形式，则会调用 `runtime.mapaccess2`。

两者的核心查找逻辑完全一致，差异仅在于返回值。本文将以 Go 1.21 的 `mapaccess1` 源码为例，剥离掉竞态检测（race/msan/asan）等边缘代码，带你一步步还原 map 的查找执行流。

## 核心执行流程解析

将复杂的源码解构，`mapaccess1` 的查找过程可以清晰地划分为四个主要步骤：前置检查、定位 Bucket、处理扩容、以及桶内遍历。

### 1. 前置检查与并发防御

在真正开始计算哈希之前，源码首先进行了一系列的状态校验：

```go
if h == nil || h.count == 0 {
	if t.HashMightPanic() {
		t.Hasher(key, 0) // see issue 23734
	}
	return unsafe.Pointer(&zeroVal[0])
}
if h.flags&hashWriting != 0 {
	fatal("concurrent map read and map write")
}
```

观察这段代码，我们可以思考两个问题：

**第一，为什么读取一个 `nil` 的 map 不会引发 panic，而是返回零值？**
答案就在前三行。如果 map 为空或尚未初始化，Go 会直接返回对应元素类型的零值指针（`&zeroVal[0]`）。不过这里有一个反直觉的细节：即使 map 为空，如果传入的 key 的哈希函数可能会触发 panic（`t.HashMightPanic()`），Go 依然会强制计算一次哈希。这是为了严格遵守语言规范：如果 key 本身是不可哈希的（例如包含 slice），执行 `m[k]` 必须引发 panic。

**第二，Go 是如何检测 map 的并发读写的？**
通过检查 `h.flags` 中的 `hashWriting` 标志位。如果该位被设置（通常由 `mapassign` 或 `mapdelete` 写入），说明正有其他 goroutine 在修改 map。此时 Go 会毫不犹豫地抛出 `fatal` 错误，导致程序崩溃。这种 fail-fast 机制强制我们在并发场景下必须使用同步原语（如 `sync.RWMutex`）来保护 map。

### 2. 计算哈希与定位 Bucket

通过了前置检查，接下来需要确定目标 key 究竟存放在哪个 bucket 中。

```go
hash := t.Hasher(key, uintptr(h.hash0))
m := bucketMask(h.B)
b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.BucketSize)))
```

Go 会计算出 key 的完整哈希值，并将这个哈希值巧妙地拆分为两部分使用：**低位**用于定位 Bucket，**高位**用于桶内快速过滤。

在这里，哈希值的**低位**（Low bits）发挥了作用。`h.B` 表示当前 map 拥有 $2^B$ 个 bucket，通过掩码 `m`（即 $2^B - 1$）与哈希值进行按位与操作（`hash&m`），可以快速取到哈希值的低 `B` 位，进而通过指针运算定位到具体的 bucket 内存地址。

### 3. 处理扩容状态下的查找

定位到 bucket 后，是否就可以直接开始遍历了？
并非如此。我们必须考虑一个动态场景：**如果此时 map 正在进行扩容，数据可能还没有迁移到新的 bucket 中，该去哪里找？**

```go
if c := h.oldbuckets; c != nil {
	if !h.sameSizeGrow() {
		// 翻倍扩容：旧的 bucket 数量是现在的一半，掩码右移 1 位
		m >>= 1
	}
	oldb := (*bmap)(add(c, (hash&m)*uintptr(t.BucketSize)))
	if !evacuated(oldb) {
		b = oldb
	}
}
```

Go 的 map 扩容是渐进式的。源码通过判断 `h.oldbuckets != nil` 来确认是否处于扩容状态。如果是，则需要去旧的 bucket 数组中寻找。

这里有一个精妙的位运算优化：如果是翻倍扩容，旧的 bucket 数量恰好是当前的一半。Go 直接将当前的掩码 `m` 右移一位（`m >>= 1`），就得到了旧 bucket 的掩码，避免了重新计算。
随后，通过 `!evacuated(oldb)` 判断该旧 bucket 是否已经完成了数据迁移。如果尚未迁移，说明我们要找的数据肯定还在旧 bucket 中，于是将查找目标 `b` 重新指向这个旧 bucket。

### 4. 双层循环遍历与精确匹配

确定了最终要查找的 bucket 后，就进入了实质性的比对阶段。为了加速比较，Go 提取了哈希值的**高 8 位**作为 `tophash`。

```go
top := tophash(hash)
bucketloop:
for ; b != nil; b = b.overflow(t) {
	for i := uintptr(0); i < bucketCnt; i++ {
		if b.tophash[i] != top {
			if b.tophash[i] == emptyRest {
				break bucketloop
			}
			continue
		}
		// ... 省略指针运算与解引用代码 ...
		if t.Key.Equal(key, k) {
			// ... 计算并返回 value 的指针 ...
		}
	}
}
```

这里采用了一个双层循环：外层遍历当前 bucket 及其挂载的所有溢出桶（overflow buckets），内层遍历 bucket 内部的 8 个槽位。

**为什么不直接比较 key，而是先比较 `tophash`？**
因为完整 key 的比较（如长字符串或复杂结构体）可能非常耗时。通过先比较高 8 位的 `tophash`，可以快速过滤掉绝大多数不匹配的槽位。
此外，`tophash` 还承担了状态标记的职责。如果遇到特殊的控制标记 `emptyRest`，说明当前槽位及后续所有槽位全为空，此时可以直接 `break bucketloop`，提前终止整个查找过程，极大地提升了效率。

只有当 `tophash` 匹配时，Go 才会通过指针偏移计算出 key 的实际内存地址，并调用类型特定的 `equal` 函数进行精确比较。如果完全相等，再计算出对应 value 的地址并返回。

## 总结

回顾 `mapaccess1` 的完整链路，其设计哲学体现了对性能的极致追求：
1. **防御优先**：前置拦截空 map 和并发写操作，确保运行时安全。
2. **位运算艺术**：将哈希值拆分为低位寻址和高位过滤，并在扩容计算中巧妙复用掩码。
3. **平滑过渡**：在渐进式扩容期间，智能路由到旧 bucket 或新 bucket。
4. **短路优化**：利用 `tophash` 进行前置拦截，并借助 `emptyRest` 标记实现提早退出。

理解了这些底层机制，我们在日常编写 Go 代码时，就能更加从容地应对 map 的并发安全问题，并对其底层的性能开销有更准确的评估。

## 附：mapaccess1 核心源码

剥离掉竞态检测后的核心源码如下，供对照参考：

```go fold
func mapaccess1(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	if h == nil || h.count == 0 {
		if t.HashMightPanic() {
			t.Hasher(key, 0) // see issue 23734
		}
		return unsafe.Pointer(&zeroVal[0])
	}
	if h.flags&hashWriting != 0 {
		fatal("concurrent map read and map write")
	}
	hash := t.Hasher(key, uintptr(h.hash0))
	m := bucketMask(h.B)
	b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.BucketSize)))
	if c := h.oldbuckets; c != nil {
		if !h.sameSizeGrow() {
			// There used to be half as many buckets; mask down one more power of two.
			m >>= 1
		}
		oldb := (*bmap)(add(c, (hash&m)*uintptr(t.BucketSize)))
		if !evacuated(oldb) {
			b = oldb
		}
	}
	top := tophash(hash)
bucketloop:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if t.Key.Equal(key, k) {
				e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				if t.IndirectElem() {
					e = *((*unsafe.Pointer)(e))
				}
				return e
			}
		}
	}
	return unsafe.Pointer(&zeroVal[0])
}
```