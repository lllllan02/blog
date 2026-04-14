---
title: 遍历的无序性
aliases: fb25a1e0-77ce-4982-9a06-371c014adddb
date: 2026-04-14 11:42:22
card: false
order: 
tags:
  - golang
  - map
---

在 Go 语言中，对 `map` 进行遍历时，元素的返回顺序是**完全随机且不可预测的**。即使你没有对 `map` 进行任何修改，多次遍历同一个 `map` 也可能得到不同的顺序。

这种设计并非底层实现的缺陷，而是 Go 语言核心团队**刻意为之**的特性。

## 1. 为什么设计为无序？

在早期的 Go 版本中，`map` 的遍历顺序虽然没有保证，但在未发生扩容的情况下，遍历顺序往往是稳定的。这导致许多开发者在编写代码时，潜意识里依赖了这种“稳定的遍历顺序”。

然而，`map` 的底层实现（如哈希函数、扩容机制）在未来的版本中可能会发生变化。一旦底层机制改变，原本依赖遍历顺序的代码就会出现难以排查的 Bug。

为了从根本上杜绝开发者对 `map` 遍历顺序的依赖，Go 团队在发布 Go 1.0 时引入了**随机化遍历**的机制。这是一种典型的“防御性设计”：通过主动暴露不确定性，强制开发者编写更健壮的代码。

## 2. 真实案例演示

我们可以通过一段简单的代码来观察这种无序性：

```go
package main

import "fmt"

func main() {
	m := map[int]string{
		1: "a",
		2: "b",
		3: "c",
		4: "d",
	}

	// 第一次遍历
	for k, v := range m {
		fmt.Printf("%d:%s ", k, v)
	}
	fmt.Println()

	// 第二次遍历
	for k, v := range m {
		fmt.Printf("%d:%s ", k, v)
	}
	fmt.Println()
}
```

运行上述代码，你会发现两次遍历的输出顺序极大概率是不同的。

## 3. 底层机制：mapiterinit 与 mapiternext

在 Go 的 runtime 中，`for range` 遍历 `map` 的操作会被编译器转换为对 `mapiterinit` 和 `mapiternext` 函数的调用。

- `mapiterinit`：负责初始化迭代器 `hiter`，注入随机性，决定遍历的起点。
- `mapiternext`：负责执行具体的遍历逻辑，包括在常规桶、溢出桶中寻找下一个元素，以及处理极其复杂的**扩容期间的遍历**。

### 3.1 随机起点的生成 (mapiterinit)

在 `mapiterinit` 中，runtime 会调用 `fastrand()` 生成一个随机数，并利用这个随机数决定遍历的**起始桶（Bucket）**和**起始槽位（Cell/Offset）**。

其核心逻辑可以简化为以下模型：

```go
// 截取自 Go 1.21: src/runtime/map.go 中的 mapiterinit 函数
func mapiterinit(t *maptype, h *hmap, it *hiter) {
	// ... 省略部分代码 ...

	// 生成一个随机数
	r := uintptr(fastrand())
	if h.B > 31-bucketCntBits {
		r += uintptr(fastrand()) << 31
	}

	// 决定起始桶 (startBucket)
	// 通过随机数 r 结合掩码计算出一个随机的桶索引
	it.startBucket = r & bucketMask(h.B)
	
	// 决定起始槽位 (offset)
	// 决定在起始桶中，从哪个位置（0~7）开始遍历
	it.offset = uint8(r >> h.B & (bucketCnt - 1))

	// 将当前桶设置为起始桶
	it.bucket = it.startBucket
	
	// ... 省略部分代码 ...
	
	// 开始执行第一次 next
	mapiternext(it)
}
```

### 3.2 遍历与推进 (mapiternext)

当 `mapiterinit` 确定了起点后，`mapiternext` 就会接管后续的遍历工作。它的基本推进逻辑如下：

1. **桶内遍历**：从当前桶的 `offset` 槽位开始，依次遍历该桶内的 8 个槽位（如果到达末尾则绕回开头，确保 8 个槽位都被访问到）。
2. **溢出桶遍历**：如果当前桶有溢出桶（Overflow Bucket），则继续遍历溢出桶中的元素。
3. **下一个桶**：当前桶及其溢出桶遍历完毕后，按顺序进入下一个桶（`bucket++`），并在新桶中**同样从 `offset` 槽位开始遍历**。
4. **结束条件**：当遍历回 `startBucket` 且所有元素都已访问时，遍历结束。

### 3.3 扩容期间的遍历（核心难点）

`mapiternext` 中最复杂、最精妙的部分在于**处理扩容期间的遍历**。

如果在遍历时，`map` 正在进行扩容（即 `oldbuckets` 不为 `nil`），此时数据可能一部分在 `buckets`（新桶）中，一部分还在 `oldbuckets`（旧桶）中。如果直接遍历新桶，可能会漏掉还没迁移过来的旧数据；如果直接遍历旧桶，又可能会读到已经被迁移甚至修改过的数据。

为了解决这个问题，`mapiternext` 采用了一种非常巧妙的策略：**“当遍历到新桶时，如果发现对应的旧桶还没迁移，就直接去旧桶里找数据。”**

具体流程如下：
1. 遍历器始终按照**新桶**的序号进行遍历。
2. 当准备遍历某个新桶时，先检查它对应的旧桶（`oldbucket`）是否已经完成了迁移（通过检查 `tophash` 的状态位 `evacuatedX` 或 `evacuatedY`）。
3. **如果旧桶已经迁移完毕**：直接遍历当前的新桶。
4. **如果旧桶还没迁移**：遍历器会“穿越”回旧桶，遍历旧桶中的数据。
   - 但是这里有一个陷阱：如果是翻倍扩容，一个旧桶的数据会被分流到两个新桶（X 部分和 Y 部分）。
   - 遍历器在旧桶中捞数据时，必须重新计算旧桶中每个 key 的哈希值，**只返回那些本该属于当前新桶的 key**。那些属于另一个新桶的 key 会被忽略（它们会在遍历到另一个新桶时被处理）。

我们来看看 Go 1.21 中 `mapiternext` 的这段核心源码：

```go
// 截取自 Go 1.21: src/runtime/map.go 中的 mapiternext 函数
func mapiternext(it *hiter) {
	h := it.h
	// ... 省略部分代码 ...

	for ; it.bucket != it.startBucket || !it.wrapped; it.bucket++ {
		// ... 省略部分代码 ...
		
		bucket := it.bucket & it.B // 当前要遍历的新桶序号
		
		// 检查是否正在扩容，且迭代器是在扩容期间启动的
		if h.growing() && it.B == h.B {
			// Iterator was started in the middle of a grow, and the grow isn't done yet.
			// 如果旧桶还没有被迁移，我们需要遍历旧桶，并且只返回那些将要迁移到当前新桶的元素。
			oldbucket := bucket & it.h.oldbucketmask()
			b := (*bmap)(add(h.oldbuckets, oldbucket*uintptr(t.bucketsize)))
			if !evacuated(b) {
				// 旧桶未迁移，去旧桶里找
				checkBucket = b
			} else {
				// 旧桶已迁移，直接找新桶
				checkBucket = (*bmap)(add(it.buckets, bucket*uintptr(t.bucketsize)))
			}
		} else {
			// 没有扩容，正常找新桶
			checkBucket = (*bmap)(add(it.buckets, bucket*uintptr(t.bucketsize)))
		}
		
		// ... 在 checkBucket 中执行具体的遍历逻辑 ...
	}
}
```

这种设计保证了即使在渐进式扩容的中间状态，遍历操作也能不重不漏地访问到所有的键值对，且不需要对整个 `map` 加锁。

## 4. 权衡与妥协

::: [!info] 性能与规范的博弈
引入随机化遍历并非没有代价。调用 `fastrand()` 生成随机数会带来微小的性能损耗。同时，为了支持在扩容期间的安全遍历，`mapiternext` 的代码逻辑变得异常复杂，增加了运行时的开销。然而，Go 团队认为，相比于未来可能出现的隐式 Bug 和向后兼容性问题，这点性能损耗是完全值得的。
:::

如果你在业务场景中确实需要按特定顺序（如按键的字典序）遍历 `map`，你必须自行维护顺序。通常的做法是提取所有的键到一个切片中，对切片进行排序，然后再按排序后的键去访问 `map`：

```go
// 提取所有的键
keys := make([]int, 0, len(m))
for k := range m {
	keys = append(keys, k)
}

// 对键进行排序
sort.Ints(keys)

// 按排序后的键遍历 map
for _, k := range keys {
	fmt.Printf("%d:%s ", k, m[k])
}
```

这种做法虽然增加了内存开销和排序的时间复杂度，但保证了行为的绝对可预期性。