---
title: Slice 扩容机制
aliases: 8c6749b6-458a-4aed-9ac1-bf582271a7fd
date: 2026-02-11 14:26:57
card: true
order: 4
tags:
  - golang
  - slice
  - go1.21
  - source-reading
---

Slice 的扩容机制集中体现在 [growslice](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/slice.go#L157) 函数中。

你是否好奇过，当我们不断向切片中追加元素，直到其容量耗尽时，Go 语言是如何在底层默默地为我们分配更大空间的？这个过程不仅涉及内存的重新分配，还包含了精心设计的容量增长策略。

简单来说，当往 Slice 中添加元素导致容量不足时，系统便会调用 `growslice` 进行扩容。需要注意的是，Go 中的切片并没有内置的缩容机制，扩容后分配的底层数组会一直保留，直到被垃圾回收。

## 探秘 growslice：它的核心职责是什么？

`growslice` 的核心职责非常明确：它接收一个旧的 Slice 以及新增的元素数量，然后负责分配并返回一个扩容后的新 Slice。

至于何时触发扩容，它并不关心。调用方只需告知它期望的新长度，它就会完成底层的内存分配和数据迁移。

观察其函数签名，我们可以看到它接收以下关键参数：

- `oldPtr`: 旧切片底层数组的指针
- `newLen`: 期望达到的新长度
- `oldCap`: 原始切片的容量
- `num`: 本次新增的元素数量
- `et`: 切片元素的类型信息

> 提示：原始切片的长度可以通过简单的计算得出，即 `oldLen = newLen - num`。

```go
func growslice(oldPtr unsafe.Pointer, newLen, oldCap, num int, et *_type) slice
```

::: [!tip]- 什么时候调用 growslice?

那么，究竟在什么场景下会触发 `growslice` 的调用呢？

概括地说：当你在往切片里追加元素、而底层数组的剩余空间不够用时，就会触发扩容。

最常见的场景莫过于使用 `append` 函数：

- 若当前容量足够，只需简单地扩展切片的长度（`len`）；
- 若容量不足，就会调用 `growslice` 分配一个更大的底层数组，并将旧数据复制过去。

此外，`reflect` 包在扩展切片类型的 Value 时（如 `Value.Grow`），以及 `slices` 包里的 `Grow`、`Insert`、`Replace`、`Concat` 等操作，最终都会在需要时通过 `append` 或 `reflect.growslice` 间接触发 `growslice`。
:::

## 扩容策略：如何优雅地增长容量？

在 [Go 1.18](https://github.com/golang/go/commit/2dda92ff6f9f07eeb110ecbf0fc2d7a0ddd27f9d) 之前，扩容策略相对简单粗暴：以 1024 为界。但之后的版本引入了更为平滑的过渡策略，即「小切片 2 倍、大切片约 1.25 倍」，以有效减少大切片场景下的内存浪费。

### 容量计算逻辑

计算新容量（`newcap`）的逻辑主要分为三种情况：

1. **新增元素过多**：如果期望的新长度 `newLen` 甚至超过了旧容量的两倍（`newLen > 2 * oldCap`），那么直接按照 `newLen` 进行分配，以满足迫切的需求。
2. **容量较小**：如果旧容量较小（`oldCap < 256`），则直接翻倍扩容（`doublecap`），以空间换取性能，减少频繁扩容的次数。
3. **容量较大**：如果旧容量已经较大（`oldCap >= 256`），则采用公式 `newcap += (newcap + 3*threshold) / 4` 进行渐进式增长。这种方式巧妙地在 2 倍与 1.25 倍之间实现了平滑过渡。

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

在计算过程中，还需要严谨地处理潜在的溢出问题：

- 若 `newcap` 计算发生溢出（例如变为负数，`newcap <= 0`），则安全地回退为 `newcap = newLen`。
- 若传入的 `newLen < 0` 或计算出的所需内存超过了系统允许的最大分配量（`maxAlloc`），则直接触发 panic，报错 "len out of range"。

## 内存分配与对齐：从容量到实际内存

你可能会认为，计算出的 `newcap` 就是最终申请的内存大小。然而，事实并非如此。为了适配 Go 语言底层的内存分配器，计算出的内存大小还需经过 `roundupsize` 函数进行“向上取整”。

### 零大小类型的特殊处理

对于像 `struct{}` 或 `[0]T` 这样元素大小为 0（`et.Size_ == 0`）的类型，它们在物理上不占用任何内存。因此，`growslice` 不会为其分配真实的内存，而是直接返回指向全局 `zerobase` 的指针，并仅更新切片的 `len` 和 `cap`。

### 按元素大小的极致优化

为了追求极致的性能，`growslice` 针对不同的元素大小（`et.Size_`）进行了专门的优化，以尽量避免昂贵的乘除法运算：

- `Size_ == 1`：直接使用整数运算，简单高效。
- `Size_ == goarch.PtrSize`：编译器能够将其巧妙地优化为常量移位操作。
- `isPowerOfTwo(Size_)`：对于 2 的幂次方大小，使用位移操作代替乘除法。
- 其他情况：使用 `math.MulUintptr` 执行安全的乘法，防止溢出。

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

### 内存对齐的艺术

Go 的内存分配器（`mallocgc`）并非按需分配任意字节数的内存，而是按照预设的「规格」（size class）进行分配。例如，小对象（< 32KB）只能申请约 68 种固定大小之一（如 8、16、24、32、48... 字节），而大对象则按页（8KB）的整数倍分配。

这种设计背后的哲学是什么？<u>同一规格的对象可以复用同一块内存池</u>。在分配时，系统可以直接从对应 size class 的可用列表中快速获取，无需在堆中费力搜索空闲块；释放时也能迅速归还到该池中。这极大地减少了内存碎片，提升了分配效率。

[roundupsize](https://github.com/golang/go/blob/master/src/runtime/msize.go#L16) 函数的作用正是如此：给定一个请求的字节数，它会返回分配器**实际会分配**的大小（即向上取整到最近的规格）。`growslice` 在调用 `mallocgc` 之前，会先通过 `roundupsize` 算出实际的内存大小 `capmem`。这样一来，`mallocgc` 实际分配的字节数，与用 `capmem / et.Size_` 反推得到的最终 `newcap` 就能完美契合，确保切片声称的容量与实际可用的物理空间严格一致。

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

## 内存清零与写屏障：保障 GC 安全

在成功分配新的底层数组后，`growslice` 会根据元素类型是否包含指针，采取不同的处理分支，以确保垃圾回收（GC）的安全性。

### 不含指针的元素类型

如果元素不包含指针：

- 调用 `mallocgc(..., nil, false)`：分配内存时不要求清零（`needzero=false`），因为后续逻辑会手动清除需要清除的部分，避免无谓的性能损耗。
- 调用 `memclrNoHeapPointers`：仅对 `[newLen, newCap)` 这段尚未使用的尾部空间进行清零。
    - 至于 `[oldLen, newLen)` 这段空间，将由调用 `append` 的代码负责写入，`growslice` 无需越俎代庖；
    - 而 `[0, oldLen)` 这段空间，稍后会被 `memmove` 完整覆盖，同样无需提前清零。

```go showLineNumbers{265}
if et.PtrBytes == 0 {
	p = mallocgc(capmem, nil, false)
	memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)
}
```

### 含指针的元素类型

如果元素包含指针，情况则更为复杂：

- 调用 `mallocgc(..., et, true)`：分配内存时**必须**要求清零（`needzero=true`）。这是为了确保新内存中的指针位全部为 nil，从而让 GC 能够安全地进行扫描，防止扫描到随机的垃圾数据。
- 调用 `bulkBarrierPreWriteSrcOnly`：当写屏障处于开启状态时（意味着 GC 可能正在并发进行标记），在执行 `memmove` 拷贝数据之前，必须对源切片中的指针进行 **shade（涂灰）** 操作，以保证这些对象在拷贝过程中不会被 GC 漏标。由于目标内存 `p` 已经被清零（覆盖的都是 nil），因此无需处理复杂的“删除屏障”逻辑。

::: [!abstract]- 深入理解：什么是 shade？
shade 是 Go GC 三色标记法中的一个核心术语，意为「涂灰」。在并发标记阶段，对象被划分为白、灰、黑三种状态：白色表示尚未访问，灰色表示已发现可达但尚未扫描其引用的子对象，黑色表示已扫描完成。

shade 的动作，本质上就是把对象从白色变为灰色，明确地告诉 GC：「这个对象是可达的，请把它加入扫描队列，不要回收它」。如果不这样做，在 `memmove` 批量拷贝指针的瞬间，GC 可能还未扫描到源切片中的这些引用。一旦拷贝完成且原切片被丢弃，GC 可能会误判这些对象不可达而将其错误回收，造成严重的漏标问题。写屏障在指针写入前调用 shade，正是为了确保这些对象先被安全标记，然后再参与拷贝。
:::

```go showLineNumbers{272}
} else {
	p = mallocgc(capmem, et, true)
	if lenmem > 0 && writeBarrier.enabled {
		bulkBarrierPreWriteSrcOnly(uintptr(p), uintptr(oldPtr), lenmem-et.Size_+et.PtrBytes)
	}
}
```

## 数据拷贝：高效的内存搬运

最后一步，旧数据通过底层的 `memmove(p, oldPtr, lenmem)` 函数，被高效地复制到新分配的底层数组中。这种方式直接操作内存，不依赖 Go 语言层面的 `range` 循环拷贝，从而获得了极佳的性能。

## 结语

通过对 `growslice` 的解构，我们不仅看到了切片扩容的精妙策略，更窥见了 Go 语言在内存分配、对齐优化以及 GC 协作上的深厚功力。我强烈建议你亲自阅读完整的源码 [go1.21@growslice](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/slice.go#L157)，以更全面地理解这一过程。

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
