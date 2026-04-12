---
title: 零切片｜空切片｜nil 切片
aliases: 87762e95-d4ca-4a3a-b0f2-07f81fc4b6fb
date: 2026-02-11 10:08:15
card: true
order: 2
tags:
---

## 定义与分类

在日常开发中，我们经常会遇到三种看似相似但本质不同的切片状态：零切片、空切片和 nil 切片。你是否清楚它们在底层结构上的具体差异？

### 零切片

首先是零切片。当切片的长度大于 0，且其底层数组的所有元素<u>均已被初始化为该类型的“零值”</u>时，我们称之为零切片。这种情况通常发生在使用 `make` 分配内存或对已有数组进行切片化时。

```go
slice1 := make([]int, 3)  // 0 0 0
slice2 := make([]*int, 3) // nil nil nil
```

### 空切片

那么，如果切片的长度和容量均为 0，它就是 nil 切片吗？并非如此。空切片是指长度和容量均为 0，但其底层的数组指针<u>并非为 nil，而是指向一个表示“零字节分配”的特殊固定地址</u>（即 `zerobase`）。

```go
slice3 := []int{}        // []
slice4 := make([]int, 0) // []
```

### nil 切片

真正的 nil 切片，是指长度和容量均为 0，且底层数组指针<u>明确为 nil</u> 的切片。这通常发生在仅声明变量但未进行初始化的情况下。

```go
var slice5 []int      // nil
slice6 := *new([]int) // nil
```

## 状态对比与验证

为了更直观地观察这几种切片状态在运行时的表现，我们可以通过以下代码进行对比验证：

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

执行上述代码，观察输出结果。你会发现一个有趣的现象：虽然切片变量本身的地址（address）每次运行都是随机分配的，但由 `[]int{}` 和 `make([]int, 0)` 创建的空切片，它们的底层数组地址（array.address）不仅非零，而且完全相同。

```bash
          []int: [], len: 0, cap: 0, address: 0x140000b6018, array.address:             0, json: null, isNil: true
    *new([]int): [], len: 0, cap: 0, address: 0x140000b6060, array.address:             0, json: null, isNil: true
        []int{}: [], len: 0, cap: 0, address: 0x140000b6078, array.address:    4378872992, json:   [], isNil: false
 make([]int, 0): [], len: 0, cap: 0, address: 0x140000b60c0, array.address:    4378872992, json:   [], isNil: false
 make([]int, 3): [0 0 0], len: 3, cap: 3, address: 0x140000b6108, array.address: 1374390214704, json: [0,0,0], isNil: false
```

> 提示：这里需要区分“切片变量本身的地址”与“切片底层数组的地址”。当我们讨论空切片或 nil 切片时，关注的焦点始终是其内部的 `array` 指针状态。

## 深入底层结构

![[1770775158.excalidraw.png]]

零切片的结构非常直观，即底层数组被零值填充。但为什么 Go 语言要区分空切片和 nil 切片？那个相同的神秘地址又是什么？

### 探秘 [zerobase](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/malloc.go#L888)

在 Go 的运行时源码 `/src/runtime/malloc.go` 中，定义了一个名为 `zerobase` 的全局变量。它的核心作用就是作为所有零字节分配请求的统一基地址。

```go
// base address for all 0-byte allocations
var zerobase uintptr
```

当我们深入到[内存分配的具体实现](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/malloc.go#L958) `mallocgc` 函数时，可以看到如下逻辑：

```go
func mallocgc(size uintptr, typ *_type, needzero bool) unsafe.Pointer {
	...

	// 如果请求分配的大小为 0，直接返回 zerobase 的地址
	if size == 0 {
		return unsafe.Pointer(&zerobase)
	}

    ...
}
```

### 设计哲学：为何如此设计？

你可能会问，为什么不直接让所有长度为 0 的切片都指向 nil 呢？

Go 语言的这种设计保证了所有零大小的对象在内存中都能拥有一个<u>合法的、非 nil 的内存地址</u>。这在进行指针运算或与其他底层系统交互时，可以避免不必要的 nil 指针异常。同时，通过让所有零大小对象共享同一个 `zerobase` 地址，Go 极大地节省了内存空间，避免了为每个空对象单独分配内存的开销。
