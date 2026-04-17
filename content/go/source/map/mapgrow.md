---
title: 扩容机制（hashGrow 与 evacuate）
aliases: 54c7d285-4878-4c1e-99eb-57d2f814da07
date: 2026-04-13 12:00:00
card: false
order: 8
tags: 
  - golang
  - source-reading
  - map
  - go1.21
---

在 Go 的 map 中，随着数据的不断插入，哈希冲突会增加，溢出桶会变多，导致查找和插入的效率下降。为了维持 $O(1)$ 的时间复杂度，map 必须在合适的时机进行**扩容（Grow）**。

Go 的 map 扩容并非一次性完成，而是分为两个阶段：
1. **触发与准备（`hashGrow`）**：计算新的容量，分配新桶，并将旧桶挂载到 `oldbuckets`。
2. **渐进式迁移（`evacuate`）**：在后续的每次插入或删除操作中，顺手搬迁 1~2 个旧桶的数据到新桶中。

## 触发条件

在 `mapassign`（插入数据）时，如果发现当前 map 尚未处于扩容状态（`!h.growing()`），会进行两项关键检查：

```go
if !h.growing() && (overLoadFactor(h.count+1, h.B) || tooManyOverflowBuckets(h.noverflow, h.B)) {
    hashGrow(t, h)
    goto again
}
```

这两个条件对应了两种不同的扩容策略：

### 条件一：装载因子过高（翻倍扩容）

**装载因子（Load Factor）** = 元素总数 / 桶总数。
当 `count > 6.5 * (1 << B)` 时，触发**翻倍扩容**。

```go
// overLoadFactor reports whether count items placed in 1<<B buckets is over loadFactor.
func overLoadFactor(count int, B uint8) bool {
	return count > bucketCnt && uintptr(count) > loadFactorNum*(bucketShift(B)/loadFactorDen)
}
```

其中 `bucketCnt` 为 8，`loadFactorNum` 为 13，`loadFactorDen` 为 2，因此 `13/2 = 6.5`。这意味着平均每个 bucket 里装了超过 6.5 个元素，桶已经很拥挤，哈希冲突严重。此时需要将 bucket 数量翻倍（`B = B + 1`），以降低冲突率。

### 条件二：溢出桶过多（等量扩容）

当装载因子没有超标，但溢出桶（overflow buckets）的数量过多时，触发**等量扩容（sameSizeGrow）**。

```go
// tooManyOverflowBuckets reports whether noverflow buckets is too many for a map with 1<<B buckets.
func tooManyOverflowBuckets(noverflow uint16, B uint8) bool {
	if B > 15 {
		B = 15
	}
	return noverflow >= uint16(1)<<(B&15)
}
```

- **什么是“过多”？** Go 设定了一个动态的判定阈值：
  - 当 $B \le 15$ 时：如果溢出桶的数量 $\ge$ 常规桶的数量（即 $2^B$），就认为溢出桶过多。
  - 当 $B > 15$ 时：为了防止超大 map 的阈值过高，Go 将判定上限固定在了 $2^{15}$（即 32768 个）。只要溢出桶数量达到这个硬性上限，即判定为过多。
- **为什么会出现这种情况？** 通常是因为 map 经历了大量的插入和删除。元素被删除了，装载因子降下来了，但曾经分配的溢出桶依然像链表一样挂在那里，导致内存碎片化，遍历效率极低。
- **等量扩容的目的**：不增加 bucket 的总数（`B` 不变），而是重新分配一次同样大小的连续内存，将原本松散在溢出桶里的数据紧凑地搬迁到新桶里，从而**消除内存碎片**。

## 准备阶段：hashGrow

`hashGrow` 函数的任务非常简单，它只做“分配”，不做“搬迁”。

```go
func hashGrow(t *maptype, h *hmap) {
	// 如果是装载因子过高，B 加 1（翻倍扩容）
	// 如果是溢出桶过多，B 保持不变（等量扩容）
	bigger := uint8(1)
	if !overLoadFactor(h.count+1, h.B) {
		bigger = 0
		h.flags |= sameSizeGrow
	}
	oldbuckets := h.buckets
	newbuckets, nextOverflow := makeBucketArray(t, h.B+bigger, nil)

	// 将当前的 buckets 降级为 oldbuckets
	h.B += bigger
	h.flags = h.flags &^ iterator     // 清理迭代器标志位
	h.oldbuckets = oldbuckets
	h.buckets = newbuckets            // 挂载新分配的 buckets
	h.nevacuate = 0                   // 搬迁进度清零
	h.noverflow = 0                   // 溢出桶计数清零

	// 处理额外的溢出桶指针
	if h.extra != nil && h.extra.overflow != nil {
		if h.extra.oldoverflow != nil {
			throw("oldoverflow is not nil")
		}
		h.extra.oldoverflow = h.extra.overflow
		h.extra.overflow = nil
	}
	if nextOverflow != nil {
		if h.extra == nil {
			h.extra = new(mapextra)
		}
		h.extra.nextOverflow = nextOverflow
	}
}
```

执行完 `hashGrow` 后，map 处于**正在扩容**状态（`h.oldbuckets != nil`）。此时新数据会插入到 `newbuckets`，但旧数据还在 `oldbuckets` 里等待搬迁。

## 渐进式迁移：evacuate

如果一次性把所有旧桶的数据搬迁完，对于大容量的 map 会造成显著的性能抖动（Stop The World 效应）。因此，Go 采用了**渐进式迁移**策略。

在每次执行赋值（`mapassign`）或删除（`mapdelete`）时，都会调用 `growWork` 来协助搬迁：

```go
func growWork(t *maptype, h *hmap, bucket uintptr) {
	// 搬迁当前操作触及的旧桶
	evacuate(t, h, bucket&h.oldbucketmask())

	// 如果还在扩容中，再顺手搬迁一个进度条上的旧桶
	if h.growing() {
		evacuate(t, h, h.nevacuate)
	}
}
```

每次最多搬迁 2 个桶：一个是当前操作命中的桶，另一个是按顺序（`h.nevacuate`）推进的桶。

### 搬迁逻辑（X 与 Y）

`evacuate` 函数是扩容的核心。对于翻倍扩容，旧桶 `i` 中的数据，在搬迁后会被分流到两个新桶中：
- **X 部分**：留在原索引位置 $i$。
- **Y 部分**：移动到新索引位置 $i + 2^{oldB}$。

这是因为容量翻倍后，哈希掩码多取了一位（高一位）。如果这一位是 0，数据去 X 桶；如果是 1，数据去 Y 桶。

```go
// evacuate 核心逻辑简化版
func evacuate(t *maptype, h *hmap, oldbucket uintptr) {
	b := (*bmap)(add(h.oldbuckets, oldbucket*uintptr(t.BucketSize)))
	newbit := h.noldbuckets()

	// 判断是否已经搬迁过
	if !evacuated(b) {
		// x 和 y 分别代表新桶的两部分
		var xy [2]evacDst
		x := &xy[0]
		x.b = (*bmap)(add(h.buckets, oldbucket*uintptr(t.BucketSize))) // X 桶
		
		if !h.sameSizeGrow() {
			y := &xy[1]
			y.b = (*bmap)(add(h.buckets, (oldbucket+newbit)*uintptr(t.BucketSize))) // Y 桶
		}

		// 遍历旧桶及其溢出桶
		for ; b != nil; b = b.overflow(t) {
			for i := uintptr(0); i < bucketCnt; i++ {
				top := b.tophash[i]
				if isEmpty(top) {
					b.tophash[i] = evacuatedEmpty
					continue
				}

				// 计算数据应该去 X 还是 Y
				hash := t.Hasher(k, uintptr(h.hash0))
				useY := hash&newbit != 0
				if h.sameSizeGrow() {
					useY = false // 等量扩容全部去 X
				}

				// 将数据拷贝到对应的 dst (x 或 y)
				dst := &xy[0]
				if useY {
					dst = &xy[1]
				}
				// ... 执行内存拷贝 ...
			}
		}
	}

	// 更新搬迁进度条 nevacuate
	if oldbucket == h.nevacuate {
		advanceEvacuationMark(h, t, newbit)
	}
}
```

当 `h.nevacuate` 推进到旧桶总数时，说明所有旧桶都搬迁完毕。此时会清理 `oldbuckets` 指针，完成扩容。

## 总结

- **触发时机**：装载因子 > 6.5（翻倍扩容）或溢出桶过多（等量扩容，用于整理碎片）。
- **准备阶段**：`hashGrow` 仅分配新内存，保留旧内存。
- **渐进搬迁**：写操作时触发 `evacuate`，每次搬迁 1~2 个桶，避免性能毛刺。翻倍扩容时，旧桶数据按哈希值高位分流到 X 和 Y 两个新桶中。
