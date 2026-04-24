---
title: Slice 扩容机制
aliases: 8c6749b6-458a-4aed-9ac1-bf582271a7fd
date: 2026-02-11 14:26:57
order: 4
tags:
  - golang
  - slice
  - go1.21
  - source-reading
---


当切片容量不足以容纳新增元素时，Go 会调用底层的 `growslice` 函数进行扩容。在 Go 1.18 之后，扩容策略从生硬的 2 倍/1.25 倍切换为更平滑的数学过渡公式。分配内存时，计算出的所需字节数会通过 `roundupsize` 向上对齐到内存分配器的标准规格（Size Class）。整个过程伴随着严格的内存清零与 GC 写屏障控制（Shade），以确保并发标记的安全性。

需要注意的是，Go 并没有为切片提供内置的缩容（Shrink）机制，底层数组分配后会一直存活直到切片被完全释放。这种设计用潜在的内存冗余换取了运行时的极致性能（Trade-off）。

## 核心职责与触发时机

观察 `src/runtime/slice.go` 中的函数签名：

```go
// 适用于 Go 1.21+
func growslice(oldPtr unsafe.Pointer, newLen, oldCap, num int, et *_type) slice
```

`growslice` 的职责非常单一：接收旧切片的底层数组指针、期望的新长度、旧容量、新增元素数量以及元素类型信息，返回一个分配好内存的新切片视图。它**不关心何时触发**，仅负责执行底层的分配和迁移。

通常，以下操作会在切片容量耗尽时隐式触发 `growslice`：
- 使用 `append` 追加元素。
- `reflect` 包操作（如 `Value.Grow`）。
- `slices` 包的修改操作（如 `Grow`、`Insert`、`Replace`、`Concat`）。

## 容量增长策略

在 Go 1.18 之前，扩容以 1024 为界：小于 1024 翻倍，大于 1024 增长 1.25 倍。这种一刀切的阈值在跨越边界时会导致容量的剧烈跳变。

目前的策略采用了更平滑的过渡公式：

1. **按需分配**：如果期望的新长度 `newLen` 超过了旧容量的两倍（`newLen > 2 * oldCap`），直接使用 `newLen` 作为新容量。
2. **小容量翻倍**：如果旧容量小于 256（`threshold`），直接翻倍（`doublecap`），以空间换取时间，减少早期频繁扩容的开销。
3. **平滑过渡**：当旧容量大于等于 256 时，应用公式 `newcap += (newcap + 3*threshold) / 4` 循环累加，直到满足新长度需求。该公式使得增长率从 2.0 逐渐平滑收敛到 1.25。

```go fold="newcap 容量计算逻辑"
// 适用于 Go 1.21+
newcap := oldCap
doublecap := newcap + newcap
if newLen > doublecap {
	newcap = newLen
} else {
	const threshold = 256
	if oldCap < threshold {
		newcap = doublecap
	} else {
		// 检测溢出并防止无限循环
		for 0 < newcap && newcap < newLen {
			// 平滑过渡公式
			newcap += (newcap + 3*threshold) / 4
		}
		if newcap <= 0 {
			newcap = newLen
		}
	}
}
```

## 内存对齐与真实分配

算出 `newcap` 后，是否就直接向系统申请 `newcap * 元素大小` 的物理内存？

并非如此。Go 的内存分配器（`mallocgc`）为了减少外部内存碎片并提高分配速度，将内存划分为大约 68 种固定大小的规格（Size Class，例如 8、16、32、48 字节等）。

如果切片计算出需要 40 字节的内存，分配器实际上会分配 48 字节的块。`growslice` 会调用 `roundupsize` 函数，提前计算出分配器**真实会分配**的内存大小（`capmem`），再反推并更新最终的 `newcap`（即 `newcap = capmem / 元素大小`）。

这种设计的 **权衡（Trade-off）** 在于：牺牲了极少的内部碎片（多分配的未用字节），换取了内存池对象的高效复用能力。这也是为什么我们在使用 `append` 时，最终得到的切片容量往往略大于理论计算值的原因。

### 零大小类型的优化

如果元素类型不占用空间（如 `struct{}`，`et.Size_ == 0`），`growslice` 不会触发真正的内存分配，而是直接返回指向全局 `zerobase` 的指针，并仅更新长度与容量。

## GC 安全：内存清零与写屏障

分配了新的内存块后，必须进行数据的搬运。这里必须根据元素是否包含指针分情况处理，以保证垃圾回收的并发安全性。

- **元素不含指针**：直接调用 `mallocgc(..., nil, false)`，不强制清零新内存。因为旧数据会被 `memmove` 覆盖，且未写入的部分后续会被显式清零（`memclrNoHeapPointers`），这减少了无谓的 CPU 开销。
- **元素包含指针**：必须调用 `mallocgc(..., et, true)` 将新内存彻底清零。因为在并发 GC 期间，新内存中的随机残留数据如果未被清零，极易被错误识别为合法指针，导致扫描异常甚至程序崩溃。

### 为什么在拷贝前需要 Shade（涂灰）？

如果开启了写屏障（`writeBarrier.enabled` 为真），在通过 `memmove` 将旧数组的数据批量复制到新数组之前，必须调用 `bulkBarrierPreWriteSrcOnly` 对源切片中的指针进行 **shade（涂灰）** 处理。

为什么要这么做？在三色标记法的并发标记阶段，对象被划分为白（未访问）、灰（待扫描引用的子对象）、黑（已扫描）。如果在复制指针的瞬间，GC 尚未扫描到源切片中的引用，而复制完成后源切片很快被释放，这些引用的下游对象可能会因为漏标而被错误回收。

“涂灰”操作强制向 GC 声明：“源切片中的这些指针是活跃可达的，请务必将其加入扫描队列”。由于目标数组是刚刚分配且清零的（被覆盖的全是 `nil`），因此不需要考虑覆盖旧指针引发的可达性丢失，只需对源指针执行写屏障即可。

## 数据搬运

所有安全检查、对齐计算和分配准备就绪后，`growslice` 会使用底层的 `memmove` 函数将旧切片的数据直接复制到新内存地址中。

```go
// src/runtime/slice.go
memmove(p, oldPtr, lenmem)
```

## 附录：核心源码参考

以下是 `growslice` 的完整执行流程与注释，供深入研读：

```go fold="growslice 完整代码及注释"
// 适用于 Go 1.21+
func growslice(oldPtr unsafe.Pointer, newLen, oldCap, num int, et *_type) slice {
	oldLen := newLen - num

	// 竞态与内存错误检测（-race, -msan, -asan）
	if raceenabled {
		callerpc := getcallerpc()
		racereadrangepc(oldPtr, uintptr(oldLen*int(et.Size_)), callerpc, abi.FuncPCABIInternal(growslice))
	}
	if msanenabled {
		msanread(oldPtr, uintptr(oldLen*int(et.Size_)))
	}
	if asanenabled {
		asanread(oldPtr, uintptr(oldLen*int(et.Size_)))
	}

	if newLen < 0 {
		panic(errorString("growslice: len out of range"))
	}

	if et.Size_ == 0 {
		return slice{unsafe.Pointer(&zerobase), newLen, newLen}
	}

	// 1. 容量计算逻辑
	newcap := oldCap
	doublecap := newcap + newcap
	if newLen > doublecap {
		newcap = newLen
	} else {
		const threshold = 256
		if oldCap < threshold {
			newcap = doublecap
		} else { 
			for 0 < newcap && newcap < newLen {
				newcap += (newcap + 3*threshold) / 4
			}
			if newcap <= 0 {
				newcap = newLen
			}
		}
	}

	var overflow bool
	var lenmem, newlenmem, capmem uintptr
	
	// 2. 根据元素大小优化乘法计算与对齐
	switch {
	case et.Size_ == 1:
		lenmem = uintptr(oldLen)
		newlenmem = uintptr(newLen)
		capmem = roundupsize(uintptr(newcap))
		overflow = uintptr(newcap) > maxAlloc
		newcap = int(capmem)
	case et.Size_ == goarch.PtrSize:
		lenmem = uintptr(oldLen) * goarch.PtrSize
		newlenmem = uintptr(newLen) * goarch.PtrSize
		capmem = roundupsize(uintptr(newcap) * goarch.PtrSize)
		overflow = uintptr(newcap) > maxAlloc/goarch.PtrSize
		newcap = int(capmem / goarch.PtrSize)
	case isPowerOfTwo(et.Size_):
		var shift uintptr
		if goarch.PtrSize == 8 {
			shift = uintptr(sys.TrailingZeros64(uint64(et.Size_))) & 63
		} else {
			shift = uintptr(sys.TrailingZeros32(uint32(et.Size_))) & 31
		}
		lenmem = uintptr(oldLen) << shift
		newlenmem = uintptr(newLen) << shift
		capmem = roundupsize(uintptr(newcap) << shift)
		overflow = uintptr(newcap) > (maxAlloc >> shift)
		newcap = int(capmem >> shift)
		capmem = uintptr(newcap) << shift
	default:
		lenmem = uintptr(oldLen) * et.Size_
		newlenmem = uintptr(newLen) * et.Size_
		capmem, overflow = math.MulUintptr(et.Size_, uintptr(newcap))
		capmem = roundupsize(capmem)
		newcap = int(capmem / et.Size_)
		capmem = uintptr(newcap) * et.Size_
	}

	if overflow || capmem > maxAlloc {
		panic(errorString("growslice: len out of range"))
	}

	// 3. 内存分配、清零与 GC 写屏障
	var p unsafe.Pointer
	if et.PtrBytes == 0 {
		p = mallocgc(capmem, nil, false)
		memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)
	} else {
		p = mallocgc(capmem, et, true)
		if lenmem > 0 && writeBarrier.enabled {
			bulkBarrierPreWriteSrcOnly(uintptr(p), uintptr(oldPtr), lenmem-et.Size_+et.PtrBytes)
		}
	}

	// 4. 数据搬运
	memmove(p, oldPtr, lenmem)

	return slice{p, newLen, newcap}
}
```
