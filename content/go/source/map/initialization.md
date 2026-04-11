---
title: 初始化（makemap）
aliases: 5a487929-6cae-4f2c-aa91-16872827dc62
date: 2026-04-11 10:01:30
card: false
order: 3
tags: 
  - golang
  - source-reading
  - map
---

在 Go 语言中，map 的初始化主要通过 `make` 关键字完成，底层会调用 `runtime.makemap` 函数。本文将详细解析 map 的初始化过程，并解答两个核心问题：nil map 与空 map 的区别，以及预分配容量时桶数量的计算方式。

当我们使用 `make(map[k]v, hint)` 创建 map 时，底层调用的核心函数是 `makemap`。

```go {14, 18, 28}
// makemap 实现 Go map 的创建 make(map[k]v, hint)。
// 如果编译器确定 map 或第一个桶可以在栈上创建，h 和/或 bucket 可能非 nil。
func makemap(t *maptype, hint int, h *hmap) *hmap {
	mem, overflow := math.MulUintptr(uintptr(hint), t.Bucket.Size_)
	if overflow || mem > maxAlloc {
		hint = 0
	}

	// 初始化 Hmap
	if h == nil {
		h = new(hmap)
	}
	// 生成随机哈希种子，防止哈希碰撞攻击
	h.hash0 = fastrand()

	// 找到能容纳请求元素数量的尺寸参数 B。
	B := uint8(0)
	for overLoadFactor(hint, B) {
		B++
	}
	h.B = B

	// 分配初始哈希表
	// 如果 B == 0，buckets 字段会在后续延迟分配（在 mapassign 中）
	// 如果 hint 很大，清零这段内存会耗时较长。
	if h.B != 0 {
		var nextOverflow *bmap
		h.buckets, nextOverflow = makeBucketArray(t, h.B, nil)
		if nextOverflow != nil {
			h.extra = new(mapextra)
			h.extra.nextOverflow = nextOverflow
		}
	}

	return h
}
```

## 随机哈希种子

```go
h.hash0 = fastrand()
```

这行代码的作用是为新建的 map 初始化一个**随机的哈希种子 (Hash Seed)**。

具体来说，它的核心目的是为了**安全性**，防止**哈希碰撞攻击 (Hash Collision DoS Attack)**：

> 什么是哈希碰撞攻击？

如果 Go 语言 map 的哈希算法是固定的、可预测的，恶意攻击者就可以故意构造出大量哈希值完全相同的 key 发送给你的程序（例如作为 HTTP 请求的参数）。

> 攻击的后果：

这些 key 会全部被分配到 map 的同一个 bucket（桶）里。这会导致 map 在这个 bucket 处退化成一条长长的链表。此时，map 的查询时间复杂度会从极快的 $O(1)$ 暴增到极慢的 $O(N)$，瞬间耗尽服务器的 CPU 资源，导致服务瘫痪。

> fastrand 的巧妙化解：

通过调用 `fastrand()` 生成一个随机数赋值给 `h.hash0`，Go 保证了**每一次创建出来的 map 实例，其哈希计算规则都是独一无二的**。这样一来，即使攻击者拿到了相同的 key，在你的程序里计算出来的哈希值也被打散了，无法集中攻击同一个 bucket。

## 预分配容量与 Bucket 数量计算

当使用 `make(map[k]v, hint)` 预分配容量时，底层是如何计算所需的 bucket 数量（选出最小的 **`B`**，使得<u>“把这么多元素放进 `2^B` 个桶里”**不会**被认为已经超过负载因子</u>）的？


- **`B`**：`hmap` 里桶数量的对数，普通桶个数是 **`1 << B`**（见文件里对 `makeBucketArray` 的注释）。
- **`hint`**：前面已经做过溢出/内存上限处理，可能变成 `0`。


```go
// 找到能容纳请求元素数量的尺寸参数 B。
// hint < 0 时 overLoadFactor 返回 false，因为 hint < bucketCnt。
B := uint8(0)
for overLoadFactor(hint, B) {
	B++
}
h.B = B
```


这段代码的含义是：**从 `B = 0` 开始，只要“把 `hint` 个元素放进当前 `2^B` 个桶里”仍然算超载，就把 `B` 加 1，直到不超载为止。**
也就是说，在找**满足负载要求的最小 `B`**，用来决定一开始分配多少桶，避免新建的 map 一开始就处于“按规则该扩容”的负载状态，从而减少频繁扩容。

### `overLoadFactor` 怎么判断“超载”

这里的关键在于 `overLoadFactor(hint, B)` 函数。Go map 的装载因子（Load Factor）阈值被设定为 **6.5**（即平均每个桶存储 6.5 个元素时触发扩容）。

```go
// overLoadFactor 判断 count 个元素放入 1<<B 个桶是否超过负载因子。
func overLoadFactor(count int, B uint8) bool {
	return count > bucketCnt && uintptr(count) > loadFactorNum*(bucketShift(B)/loadFactorDen)
}
```

配合常量（每个桶最多 `bucketCnt` 个槽，负载用分数表示）：

```go
const (
	// Maximum number of key/elem pairs a bucket can hold.
	bucketCntBits = abi.MapBucketCountBits
	bucketCnt     = abi.MapBucketCount

	// Maximum average load of a bucket that triggers growth is bucketCnt*13/16 (about 80% full)
	// Because of minimum alignment rules, bucketCnt is known to be at least 8.
	// Represent as loadFactorNum/loadFactorDen, to allow integer math.
	loadFactorDen = 2
	loadFactorNum = (bucketCnt * 13 / 16) * loadFactorDen
)
```

直观理解：

1. **`count > bucketCnt`**：元素个数不超过一个桶的容量时，**不算**超载（单桶就能装下，和扩容用的负载阈值无关）。注释里也写了：`hint < 0` 时因小于 `bucketCnt` 会得到 `false`。
2. 否则用整数运算判断：在 **`1<<B` 个桶**里放 **`count`** 个元素，是否超过“每桶约 `bucketCnt*13/16`”这一平均负载（与后面**触发扩容**时用的是同一套负载概念）。`bucketShift(B)` 就是 `1<<B`，所以第二项是在和 `loadFactorNum * (1<<B) / loadFactorDen` 比较（与注释里的负载因子一致）。

### 计算过程示例

计算过程是一个循环：
1. 初始时 `B = 0`（即 1 个桶，能装 8 个元素）。
2. 调用 `overLoadFactor` 判断：如果把 `hint` 个元素放进 `2^B` 个桶中，是否会超过装载因子 6.5？
3. 如果超过了（即 `hint > 6.5 * 2^B`），则 `B++`，桶数量翻倍，继续判断。
4. 直到找到一个最小的 `B`，使得 `2^B` 个桶足以容纳 `hint` 个元素而不触发扩容。

例如：
- `hint = 10`: `B=0` 时桶容量为 8，不够；`B=1` 时桶数量为 2，最大容量 $2 \times 6.5 = 13 > 10$，所以最终 `B=1`。
- `hint = 20`: `B=1` 时容量 13，不够；`B=2` 时桶数量为 4，最大容量 $4 \times 6.5 = 26 > 20$，所以最终 `B=2`。

## makeBucketArray：分配桶数组

确定了 `B` 之后，如果 `B != 0`，则会调用 `makeBucketArray` 来实际分配桶数组的内存。

```go
func makeBucketArray(t *maptype, b uint8, dirtyalloc unsafe.Pointer) (buckets unsafe.Pointer, nextOverflow *bmap) {
	base := bucketShift(b)
	nbuckets := base
	// b 较小时，溢出桶概率很低。
	// 避免计算开销。
	if b >= 4 {
		// 增加估算的溢出桶数量
		nbuckets += bucketShift(b - 4)
		sz := t.Bucket.Size_ * nbuckets
		up := roundupsize(sz)
		if up != sz {
			nbuckets = up / t.Bucket.Size_
		}
	}
	// ... 内存分配逻辑 ...
}
```

`makeBucketArray` 的主要作用是为 map 准备好存储数据的物理空间。它的核心执行逻辑可以分为三步：

### 1. 计算需要的桶总数

*   首先计算基础桶的数量 `base = 1 << b`。
*   **预分配溢出桶**：如果 `b >= 4`（即基础桶数量 >= 16），Go 认为在后续使用中极大概率会产生哈希冲突并需要溢出桶。为了减少后续动态分配溢出桶的开销，它会提前多分配一部分溢出桶。额外分配的数量大约是 `1 << (b-4)`。
*   **内存对齐**：计算出总桶数后，会结合内存分配器的规格（`roundupsize`）向上取整，以最大化利用分配到的内存块，这可能会进一步增加实际分配的桶数量。

### 2. 内存分配或复用

*   如果 `dirtyalloc == nil`：调用 `newarray` 在堆上为这些桶分配全新的内存。
*   如果 `dirtyalloc != nil`：复用传入的内存块。根据 map 存储的数据是否包含指针，调用 `memclrHasPointers` 或 `memclrNoHeapPointers` 将这块老内存清零，防止脏数据。

### 3. 初始化溢出桶指针

*   如果实际分配的桶数量（`nbuckets`）大于基础桶数量（`base`），说明存在预分配的溢出桶。
*   函数会将 `nextOverflow` 指向第一个溢出桶的位置（即紧挨着基础桶后面的那个桶）。
*   为了在后续使用中能够低成本地判断“预分配的溢出桶是否已经用完”，Go 采用了一个巧妙的约定：把**最后一个**预分配溢出桶的 `overflow` 指针指向一个安全的非 `nil` 地址（这里直接指向了 `buckets` 数组的首地址）。这样在分配溢出桶时，只要发现下一个桶的 `overflow` 不是 `nil`，就知道预分配的桶耗尽了。

通过这些步骤，`makeBucketArray` 不仅分配了常规的基础桶，还针对较大的 map 进行了**溢出桶预分配**和**内存对齐优化**，并且支持**内存复用**，是 Go 语言 map 高效运行的重要基础。最终返回指向桶数组首地址的 `buckets` 指针，以及指向预分配溢出桶起始位置的 `nextOverflow` 指针（如果有的话）。
