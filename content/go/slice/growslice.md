---
title: Slice 扩容机制
aliases: 8c6749b6-458a-4aed-9ac1-bf582271a7fd
date: 2026-02-11 14:26:57
card: false
order:
tags:
  - golang
  - slice
  - go1.21
  - source-reading
---

Slice 的扩容机制集中体现在 [growslice](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/slice.go#L157) 函数中。

简单说，当往 Slice 中添加元素到容量不足时，就会调用 growslice 进行扩容。Go 中切片没有缩容机制，扩容后的底层数组会一直保留。

## growslice 做什么？

简单来说，它接收一个旧的 Slice 以及新增的元素数量，然后返回一个扩容后的新 Slice。

至于什么时候扩容它不管，你只需要告诉它，要扩容多少个元素，它就会给你返回一个扩容后的新 Slice。

- oldPtr: 旧的 Slice 的底层数组指针
- newLen: 期望的新的长度
- oldCap: 原始切片的容量
- num: 新增的元素数量
- et: 元素类型

> 至于原始切片的长度，直接假定为 oldLen = newLen - num。

```go
func growslice(oldPtr unsafe.Pointer, newLen, oldCap, num int, et *_type) slice
```

::: [!tip]- 什么时候调用 growslice?

growslice 的调用时机可以概括为：当你在往切片里追加元素、而底层数组的剩余空间不够用时，就会触发。

最常见的场景是 append：

- 若当前容量足够，只需扩宽切片长度；
- 若不够，就会调用 growslice 分配更大的底层数组并复制数据。

此外，reflect 包在扩展切片类型的 Value 时（如 Value.Grow），以及 slices 包里的 Grow、Insert、Replace、Concat 等，最终都会在需要扩容时通过 append 或 reflect.growslice 间接触发 growslice。
:::

## 扩容策略

[Go 1.18](https://github.com/golang/go/commit/2dda92ff6f9f07eeb110ecbf0fc2d7a0ddd27f9d) 之后，扩容不再使用固定的 1024 阈值，而是采用「小切片 2 倍、大切片约 1.25 倍」的过渡策略，以减少大切片下内存浪费。

### 容量计算逻辑

newcap 的计算分为三种情况：

1. **新增元素过多**：`newLen > 2 * oldCap` 时，直接按 newLen 分配。
2. **容量较小**：`oldCap < 256` 时，翻倍扩容。
3. **容量较大**：`oldCap >= 256` 时，采用公式 `newcap += (newcap + 3*threshold) / 4` 渐进增长，在 2 倍与 1.25 倍之间平滑过渡。

```go fold="newcap"
newcap := oldCap
doublecap := newcap + newcap
if newLen > doublecap {
    newcap = newLen
} else {
    const threshold = 256
    if oldCap < threshold {
        newcap = doublecap
    } else {
        // Check 0 < newcap to detect overflow
        // and prevent an infinite loop.
        for 0 < newcap && newcap < newLen {
            // Transition from growing 2x for small slices
            // to growing 1.25x for large slices. This formula
            // gives a smooth-ish transition between the two.
            newcap += (newcap + 3*threshold) / 4
        }
        // Set newcap to the requested cap when
        // the newcap calculation overflowed.
        if newcap <= 0 {
            newcap = newLen
        }
    }
}
```

### 溢出与边界处理

- 若 newcap 计算溢出（如 `newcap <= 0`），回退为 newcap = newLen。
- 若 newLen < 0 或 capmem > maxAlloc，直接 panic "len out of range"。

## 内存分配与对齐

计算出的 newcap 并非最终申请的内存大小，还需经过 `roundupsize` 按内存规格向上取整，以适配 Go 的内存分配器。

### 零大小类型

`struct{}`、`[0]T` 等 `et.Size_ == 0` 的类型不会分配真实内存，直接返回指向 `zerobase` 的指针，仅更新 `len` 和 `cap`。

### 按元素大小的优化

对不同 `et.Size_` 做了专门处理，避免不必要的乘除：

- `Size_ == 1`：直接用整数运算。
- `Size_ == goarch.PtrSize`：可被编译器优化为常量移位。
- `isPowerOfTwo(Size_)`：用移位代替乘除。
- 其他：使用 `math.MulUintptr` 做溢出安全的乘法。

```go
switch {
case et.Size_ == 1:
    ...
case et.Size_ == goarch.PtrSize:
    ...
case isPowerOfTwo(et.Size_):
    ...
default:
    ...
}
```

### 内存对齐

Go 的内存分配器（`mallocgc`）不会按任意字节数分配，而是按预设的「规格」来分配。小对象（< 32KB）只能申请约 68 种固定大小之一（如 8、16、24、32、48... 字节），大对象则按页（8KB）的整数倍分配。

这么做的好处是：<u>同一规格的对象可以复用同一块内存池</u>，分配时直接从对应 size class 的可用列表中取、无需在堆中搜索空闲块，释放时直接归还到该池，减少碎片、提升效率。

[roundupsize](https://github.com/golang/go/blob/master/src/runtime/msize.go#L16) 做的事情就是：给定一个请求字节数，返回分配器**实际会分配**的大小（向上取整到最近的规格）。growslice 在调用 `mallocgc` 之前先通过 `roundupsize` 算出 `capmem`，这样两件事才能对上：一是 `mallocgc` 实际分配到的字节数，二是用 `capmem / et.Size_` 反推得到的 `newcap` 才准确，否则切片声称的容量会与实际可用空间不一致。

```go
// Returns size of the memory block that mallocgc will allocate if you ask for the size.
func roundupsize(size uintptr) uintptr {
	if size < _MaxSmallSize {
		if size <= smallSizeMax-8 {
			return uintptr(class_to_size[size_to_class8[divRoundUp(size, smallSizeDiv)]])
		} else {
			return uintptr(class_to_size[size_to_class128[divRoundUp(size-smallSizeMax, largeSizeDiv)]])
		}
	}
	if size+_PageSize < size {
		return size
	}
	return alignUp(size, _PageSize)
}
```

## 内存清零与写屏障

分配新底层数组后，growslice 会根据元素类型是否含指针走不同分支。

### 不含指针的元素类型

- `mallocgc(..., nil, false)`：分配时不要求清零（`needzero=false`），因为后面会手动清除需要清除的部分。
- `memclrNoHeapPointers`：只对 `[newLen, newCap)` 这段清零。
    - `[oldLen, newLen)` 会由 append 调用方写入，growslice 不负责；
    - `[0, oldLen)` 会被 memmove 覆盖，同样无需清零。

```go showLineNumbers{265}
if et.PtrBytes == 0 {
	p = mallocgc(capmem, nil, false)
	memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)
}
```

### 含指针的元素类型

- `mallocgc(..., et, true)`：分配时要求清零（`needzero=true`），以便 GC 安全扫描；新内存中指针位全为 nil。
- `bulkBarrierPreWriteSrcOnly`：当写屏障开启时（GC 可能正在并发标记），在 `memmove` 拷贝前对源切片中的指针做 **shade**，保证这些对象不会被漏标。目标 `p` 已清零，覆盖的是 nil，无需处理“删除屏障”逻辑。

::: [!abstract]- 什么是 shade？
shade 是 Go GC 三色标记法里的术语，意为「涂灰」。在并发标记阶段，对象有白、灰、黑三种状态：白表示未访问，灰表示已发现可达、待扫描，黑表示已扫描完成。

shade 就是把对象从白变成灰，告诉 GC「这个对象是可达的，请把它加入扫描队列」。若不这样做，在 `memmove` 批量拷贝指针时，GC 可能还未扫描到源切片中的引用，就会误判为不可达而回收，造成漏标。写屏障在指针写入前调用 shade，确保这些对象先被标记，再参与拷贝。
:::

```go showLineNumbers{272}
} else {
	p = mallocgc(capmem, et, true)
	if lenmem > 0 && writeBarrier.enabled {
		bulkBarrierPreWriteSrcOnly(uintptr(p), uintptr(oldPtr), lenmem-et.Size_+et.PtrBytes)
	}
}
```

## 数据拷贝

旧数据通过 `memmove(p, oldPtr, lenmem)` 复制到新底层数组，不依赖 Go 的 range 拷贝，性能更好。

## 最后

我仍然建议你阅读完整的源码 [go1.21@growslice](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/slice.go#L157)，以理解整个过程。

```go fold="growslice 完整代码及注释"
// growslice 为切片分配新的底层存储
//
// arguments:
//
//	oldPtr = 指向切片底层数组的指针
//	newLen = 新的长度 = 原始切片的长度 + 新增的元素数量
//	oldCap = 原始切片的容量
//	   num = 新增的元素数量
//	    et = 元素类型
//
// return values:
//
//  slice {
//		newPtr = 指向新的底层存储的指针
//		newLen = 新的长度
//		newCap = 新的容量
//  }
//
// 要求新的长度大于原始切片的容量。
// 假设原始切片的长度是 newLen - num
//
// 会分配一个新的底层存储，其空间至少可容纳 newLen 个元素。
// 现有的 [0, oldLen) 范围内的条目会被复制到新的底层存储中。
// 新增的 [oldLen, newLen) 范围内的条目不会由 growslice 初始化（不过对于包含指针的元素类型，它们会被清零）。必须由调用者对其进行初始化。
// 末尾的 [newLen, newCap) 范围内的条目会被清零。
//
// growslice 这种奇特的调用约定使得调用此函数生成的代码更为简单。
// 具体来说，它接受并返回新的长度，这样旧长度就不再处于活跃状态（无需保存/恢复），并且新长度会被返回（同样也无需保存/恢复）。 
func growslice(oldPtr unsafe.Pointer, newLen, oldCap, num int, et *_type) slice {
	oldLen := newLen - num

	// 在扩容复制旧数据前，把旧切片底层数组 [0, oldLen) 这段将被读取的内存区间上报给 race/MSan/ASan 等检测器，
	// 用于竞态与内存错误（未初始化/越界/UAF）检测与定位。
	// 用 Go 的构建/测试参数开启：-race，-msan，-asan（通常需 CGO_ENABLED=1 且平台/工具链支持）。
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

	// 防御性检查，若计算出的新长度 newLen 为负（发生溢出/参数异常），
	// 直接 panic 报 “len out of range”，避免后续用非法长度继续分配/拷贝导致更严重错误。
	if newLen < 0 {
		panic(errorString("growslice: len out of range"))
	}

	// struct{}, [0]T 等零大小类型，不论长度多少都占用 0 字节。
	// 不需要分配真实内存，但仍需要更新 len 和 cap，因此返回指向 zerobase 的指针。
	if et.Size_ == 0 {
		// append 不应该创建一个 nil 指针但非零长度的切片。
		// 我们假设在这种情况下 append 不需要保留 oldPtr。
		return slice{unsafe.Pointer(&zerobase), newLen, newLen}
	}

	// go1.21 大部分情况下会按照近乎 1.25 的增速去扩容，以下是两种特例：
	// 	1. 原始容量较小: oldCap < 256，则直接两倍扩容。
	//  2. 新增元素太多: 超过了两倍扩容的速度，则直接按照 newLen 扩容。
	newcap := oldCap
	doublecap := newcap + newcap
	if newLen > doublecap {
		newcap = newLen
	} else {
		const threshold = 256
		if oldCap < threshold {
			newcap = doublecap
		} else { 
			// 检查 0 < newcap 以检测溢出情况，并防止出现无限循环。
			for 0 < newcap && newcap < newLen {
				// 从小切片按 2 倍增长过渡到大切片按 1.25 倍增长。
				// 这个公式能在这两种增长方式之间实现较为平滑的过渡。
				newcap += (newcap + 3*threshold) / 4
			}
			// 当新容量（newcap）的计算发生溢出时，将新容量设置为请求的容量。
			if newcap <= 0 {
				newcap = newLen
			}
		}
	}

	var overflow bool
	var lenmem, newlenmem, capmem uintptr
	// 针对 et.Size 的常见值进行专门处理。
	// 	对于值为 1 的情况，我们无需任何除法 / 乘法运算。
	// 	对于 goarch.PtrSize，编译器会将除法 / 乘法运算优化为常量移位操作。
	// 	对于 2 的幂次方，使用变量移位操作。
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
			// Mask shift for better code generation.
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

	// 除了检查 capmem > maxAlloc 之外，还需要检查溢出情况，
	// 以防止出现可被利用的溢出问题，在 32 位架构上，下面这个示例程序就可能因这种溢出而触发段错误：
	//
	// type T [1<<27 + 1]int64
	//
	// var d T
	// var s []T
	//
	// func main() {
	//   s = append(s, d, d, d, d)
	//   print(len(s), "\n")
	// }
	if overflow || capmem > maxAlloc {
		panic(errorString("growslice: len out of range"))
	}

	var p unsafe.Pointer
	if et.PtrBytes == 0 {
		p = mallocgc(capmem, nil, false)
		// 调用 growslice 的 append () 函数将会覆盖从 oldLen 到 newLen 的部分。
		// 只清除不会被覆盖的部分。
		// 调用 growslice 的 reflect_growslice () 函数会手动清除此处未清除的区域。
		memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)
	} else {
		// 注意：不能使用 rawmem（它避免对内存清零），因为那样垃圾回收器（GC）可能会扫描未初始化的内存。
		p = mallocgc(capmem, et, true)
		if lenmem > 0 && writeBarrier.enabled {
			// 只需要对 oldPtr 里的指针做遮罩/标记（shade），
			// 因为我们知道目标切片 p 在分配时已经被清零过，所以目的地里只包含 nil 指针。
			/*
			这里的 **“shade（遮蔽/标记）”** 是 GC 里的术语：在 **并发标记** 期间，把某个指针指向的对象“涂灰”（从 *白* 变成 *灰*，表示**已知可达、后续会被扫描**），避免 GC 因为并发写入而漏标。

			在这段 `growslice` 里发生的是 **把旧切片的数据 `memmove` 到新分配的底层数组 `p`**：

			- 当 `writeBarrier.enabled` 为真，说明 GC 可能正在并发标记；这时一次性 `memmove` 写入大量指针等价于“批量指针写入”，需要走 **批量写屏障**（`bulkBarrierPreWrite...`）。
			- 注释说只对 `oldPtr` 做 shade，是因为 **`p = mallocgc(..., true)` 已经把新内存清零**，也就是目标区域里“原本被覆盖的旧值”全是 `nil`：
			- 写屏障里有一部分逻辑是处理“覆盖旧指针可能导致可达对象丢失”（可以理解为**删除屏障**）；但这里覆盖的是 `nil`，**不会丢失任何引用**，所以不用管目标的旧值。
			- 只需要把**即将从 `oldPtr` 拷贝过去的那些指针**对应的对象标记好，确保 GC 不会在你拷贝/建立新引用的过程中把它们误判为不可达回收。

			所以这句注释的要点是：**并发 GC 时，为了让批量 `memmove` 复制指针仍然满足写屏障约束，只需扫描并标记源 `oldPtr` 中的指针；目标 `p` 是新分配且清零的，不存在需要“处理被覆盖旧指针”的情况。**
			*/
			bulkBarrierPreWriteSrcOnly(uintptr(p), uintptr(oldPtr), lenmem-et.Size_+et.PtrBytes)
		}
	}

	// 把旧切片的数据 `memmove` 到新分配的底层数组 `p`。
	memmove(p, oldPtr, lenmem)

	return slice{p, newLen, newcap}
}
```
