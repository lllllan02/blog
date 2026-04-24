---
title: 零切片｜空切片｜nil 切片
aliases: 87762e95-d4ca-4a3a-b0f2-07f81fc4b6fb
date: 2026-02-11 10:08:15
order: 2
tags:
---


Go 的切片存在三种易混淆的状态：零切片（分配了内存且初始化为零值）、空切片（长度和容量为 0，底层指针非 `nil`）和 `nil` 切片（底层指针为 `nil`）。区分这三种状态不仅关乎底层的内存分配策略，更会直接影响 JSON 序列化的结果与 API 的健壮性。

## 状态定义与内存模型

在处理边界条件时，切片的底层数组指针（`array`）、长度（`len`）和容量（`cap`）共同决定了它的运行时状态。我们可以将其严格划分为三种情况：

- **`nil` 切片**：切片仅被声明而未被初始化。此时底层 `array` 指针明确为 `nil`，长度和容量均为 0。系统尚未为其分配任何内存。
- **空切片**：切片的长度和容量均为 0，但底层 `array` 指针**非 `nil`**。它指向一个特殊的固定内存地址（即 `zerobase`），表达了“该切片已被初始化，但当前没有元素”的语义。
- **零切片**：切片的长度大于 0，底层数组已在内存中实际分配，并且所有元素都被默认初始化为了该类型的零值（例如 `int` 为 0，指针为 `nil`）。

```go
// nil 切片
var slice1 []int      
slice2 := *new([]int) 

// 空切片
slice3 := []int{}        
slice4 := make([]int, 0) 

// 零切片
slice5 := make([]int, 3)  // [0 0 0]
```

## 运行时表现与序列化差异

上述三者在内存层面的细微差异，会在实际工程中暴露出不同的行为特征。我们可以通过读取底层结构体字段并执行 JSON 序列化来进行验证。

```go fold="切片状态验证代码"
// 适用于 Go 1.21+
package main

import (
	"encoding/json"
	"fmt"
	"unsafe"
)

func printSlice(method string, slice []int) {
	bytes, _ := json.Marshal(slice)
	// 将切片强制转换为包含 3 个 int 的数组，分别对应 array 指针、len 和 cap
	var arr = *(*[3]int)(unsafe.Pointer(&slice))
	fmt.Printf("%15s: %v, len: %d, cap: %d, address: %p, array.address: %13d, json: %4s, isNil: %t\n",
		method, slice, len(slice), cap(slice), &slice, arr[0], string(bytes), slice == nil)
}

func main() {
	var slice1 []int
	printSlice("var []int", slice1)

	var slice3 = []int{}
	printSlice("[]int{}", slice3)

	var slice4 = make([]int, 0)
	printSlice("make([]int, 0)", slice4)

	var slice5 = make([]int, 3)
	printSlice("make([]int, 3)", slice5)
}
```

执行后可以观察到两个关键现象：
1. **JSON 序列化分歧**：`nil` 切片被编码为 `null`，而空切片被编码为 `[]`。在构建 RESTful API 时，若前端对 `null` 缺乏防御，直接对返回的 `nil` 切片调用 `.length` 或 `.map()` 极易导致运行期崩溃。
2. **指针复用**：由 `[]int{}` 和 `make([]int, 0)` 创建的空切片，其底层数组地址（`array.address`）不仅非 0，且指向同一个完全一致的内存地址。

![[1770775158.excalidraw.png]]

## 底层机制：zerobase 与设计哲学

为什么所有空切片的底层数组都指向同一个非 `nil` 的固定地址？为什么不直接让长度为 0 的切片统统指向 `nil`？

这其实是**语言语义设计**与**底层内存优化**的结合体：

1. **语义区分**：Go 认为“尚未初始化”（`nil`）和“已初始化但当前没有元素”（空切片）是两种截然不同的状态。就像“不存在的盒子”与“一个空盒子”的区别一样，空切片需要一个有效的指针地址来证明其“已分配、可使用”的实体状态。
2. **内存优化**：既然空切片需要非 `nil` 的指针，如果为程序中海量的空切片或空结构体（`struct{}`）都单独分配哪怕 1 字节的堆内存，也会造成巨大的内存浪费并严重拖垮垃圾回收（GC）性能。

因此，Go 运行时采用了一种极其聪明的统一分配策略：在 `src/runtime/malloc.go` 中预先定义一个名为 `zerobase` 的全局变量。当 `mallocgc` 函数接收到分配大小为 0 的请求时，它会直接绕过常规的内存分配器，统一返回这个 `zerobase` 的地址。

```go
// base address for all 0-byte allocations
var zerobase uintptr

func mallocgc(size uintptr, typ *_type, needzero bool) unsafe.Pointer {
	// ...
	// 任何 0 字节的分配请求都会指向这块统一的地址
	if size == 0 {
		return unsafe.Pointer(&zerobase)
	}
	// ...
}
```

### 权衡取舍 (Trade-offs)

这种设计引入了明确的优势与不可避免的局限性：

- **优势**：Go 保证了所有零大小的对象（包括空切片、`struct{}`）都能持有一个合法且非 `nil` 的内存地址。这避免了为海量空对象单独分配堆内存的开销，极大降低了垃圾回收（GC）的压力；同时，非 `nil` 指针使得在进行底层地址偏移或与 CGO 互操作时，能够安全避开 `nil` 指针解引用（Dereference）导致的 `panic`。
- **局限性**：在语言层面区分了“空”与“未初始化”，增加了工程师的心智负担。在编写业务逻辑时，必须时刻警惕并显式处理 `slice == nil` 和 `len(slice) == 0` 的边界差异，这往往会导致额外的防御性代码。
