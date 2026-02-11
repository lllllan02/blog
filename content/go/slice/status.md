---
title: 零切片｜空切片｜nil 切片
aliases: 87762e95-d4ca-4a3a-b0f2-07f81fc4b6fb
date: 2026-02-11 10:08:15
card: false
order: 2
tags:
---

## 定义

### 零切片

零切片是指长度大于 0，且其底层数组元素<u>均已被初始化为该类型“零值”</u>的切片（常见于 make 分配或数组切片化）。

```go
slice1 := make([]int, 3)  // 0 0 0
slice2 := make([]*int, 3) // nil nil nil
```

### 空切片

空切片是指长度和容量均为 0，但底层指针<u>指向一个表示“零字节分配”的特殊固定地址</u>（`zerobase`）而非 `nil` 的切片。

```go
slice3 := []int{}        // []
slice4 := make([]int, 0) // []
```

### nil 切片

nil 切片是指长度、容量均为 0，且底层数组指针<u>为 nil</u>的切片（通常由 `var s []int` 声明且未初始化）。

```go
var slice5 []int      // nil
slice6 := *new([]int) // nil
```

## 比较

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

> 注意，上面几种方式创建出来的切片本身地址并非 nil，所以谈及空或者 nil 的问题并不是说这个变量本身的地址，而是对象中 array 的地址。

## 底层结构分析

![[1770775158.excalidraw.png]]

零切片很好理解，就是底层元素全是零值的切片。我们接下来主要看空切片和 nil 切片的区别，以及为什么要这么做。

### [zerobase](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/malloc.go#L888)

在 `/src/runtime/malloc.go` 中定义了 `zerobase` 变量，用于表示所有零字节分配的基地址。

```go
// base address for all 0-byte allocations
var zerobase uintptr
```

到了[具体分配内存的时候](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/malloc.go#L958)，当 `size == 0`，就会返回这个 `zerobase` 地址。

```go
func mallocgc(size uintptr, typ *_type, needzero bool) unsafe.Pointer {
	...

	if size == 0 {
		return unsafe.Pointer(&zerobase)
	}

    ...
}
```

### 为什么要这么做

Go 保证所有零大小的对象在内存中都有一个<u>合法的、非 nil 的地址</u>，而为了节省空间，它们全部指向这同一个 `zerobase` 地址。
