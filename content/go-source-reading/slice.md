---
title: Go 源码阅读：Slice
aliases: 8d2e1c3a-9b4d-4f6d-a1c2-7b3a4f5d6e7f
date: 2026-02-08 11:00:00
tags:
  - golang
  - source-reading
  - slice
  - go1.21
---

> 本文档旨在引导你自主阅读 Go 1.21 的 [slice 源码](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/slice.go)
## 阅读前准备

把下面内容当作阅读源码前的准备清单与思考题。

### 推荐阅读

- [x] [Go Slices: usage and internals](https://go.dev/blog/slices-intro)：官方视角的切片设计背景，建议先读以对齐术语。
- [x] [Go 1.18 扩容策略的变化 (GitHub Commit)](https://github.com/golang/go/commit/2dda92ff6f9f07eeb110ecbf0fc2d7a0ddd27f9d)：官方改动说明与推导过程，理解扩容策略的关键来源。

### 核心结构与基础
在开始阅读代码前，请先思考并尝试在源码中找到以下问题的答案：

- [ ] **内存布局**：`slice` 在底层是如何定义的？（寻找 `slice` 结构体）
- [ ] **空切片 vs 零值切片**：`var s []int` 和 `s := []int{}` 在底层表示上有什么区别？
- [ ] **切片截取**：执行 `s2 := s1[1:3]` 时，底层发生了什么？是否发生了内存拷贝？

### 重点函数：growslice
这是切片扩容的核心逻辑，位于 `src/runtime/slice.go`。阅读时请关注：

- [ ] **扩容策略**：
    - 在 Go 1.18 之后，扩容阈值从 1024 变成了多少？
    - 为什么不再是简单的“翻倍”？
- [ ] **内存对齐（Round Up）**：
    - 扩容计算出的新容量（`newcap`）就是最终申请的内存大小吗？
    - 寻找代码中关于 `roundupsize` 的调用，理解它如何根据内存规格调整容量。
- [ ] **写屏障与内存拷贝**：
    - 扩容后旧数据是如何迁移到新内存的？（寻找 `memmove`）

### 进阶思考
- [ ] **切片作为参数**：为什么说 Go 函数传参是“值传递”，但修改切片元素却能影响原切片？
- [ ] **内存泄露风险**：在大切片上截取小切片，为什么可能导致内存泄露？源码中是否有相关提示或你能想到的避坑指南？

## 底层结构

```go
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
```

![[1770716705.excalidraw.png]]

## 零切片｜空切片｜nil 切片

> [深度解析 Go 语言中「切片」的三种特殊状态](https://juejin.cn/post/6844903712654098446)

创建切片的方式有很多，他们存在着一些细微的差异。


```go fold="slice test"
package main

import (
	"encoding/json"
	"fmt"
	"unsafe"
)

func printSlice(method string, slice []int) {
	bytes, _ := json.Marshal(slice)
	var arr = *(*[3]int)(unsafe.Pointer(&slice))
	fmt.Printf("%15s: %v, len: %d, cap: %d, address: %p, array.address: %13d, json: %4s, isNil: %t\n",
		method, slice, len(slice), cap(slice), &slice, arr[0], string(bytes), slice == nil)
}

func main() {
	var slice1 []int
	printSlice("[]int", slice1)

	var slice2 = *new([]int)
	printSlice("*new([]int)", slice2)

	var slice3 = []int{}
	printSlice("[]int{}", slice3)

	var slice4 = make([]int, 0)
	printSlice("make([]int, 0)", slice4)

	var slice5 = make([]int, 3)
	printSlice("make([]int, 3)", slice5)
}
```

执行上门这份代码，你会得到如下的输出。当然其中的 address 每次都是随机的，但有意思的是 `[]int{}` 和 `make([]int, 0)` 创建出来的切片，他们的 array.address 虽然随机确实相同的。

```bash
          []int: [], len: 0, cap: 0, address: 0x140000b6018, array.address:             0, json: null, isNil: true
    *new([]int): [], len: 0, cap: 0, address: 0x140000b6060, array.address:             0, json: null, isNil: true
        []int{}: [], len: 0, cap: 0, address: 0x140000b6078, array.address:    4378872992, json:   [], isNil: false
 make([]int, 0): [], len: 0, cap: 0, address: 0x140000b60c0, array.address:    4378872992, json:   [], isNil: false
 make([]int, 3): [0 0 0], len: 3, cap: 3, address: 0x140000b6108, array.address: 1374390214704, json: [0,0,0], isNil: false
```

通过这份代码我们来认识一下这三个定义：

- 零切片(`make([]int, 3)`): 元素值为零的切片，比如 []int 中的元素全是 0，[]*int 中的元素全是 nil。
- 空切片(`[]int{}`, ` make([]int, 0)`): 长度、容量均为零，但是 array 被分配到一个特殊地址 `zerobase` 的切片。
- nil 切片(`[]int`, `*new([]int)`): 长度、容量甚至 array 地址都是零的切片。

> 注意，上面几种方式创建出来的切片本身地址并非 nil，所以谈及空或者 nil 的问题并不是说这个变量本身的地址，而是对象中 array 的地址。

## growslice

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