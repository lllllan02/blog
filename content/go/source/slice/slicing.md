---
title: 切片截取
aliases: b3ea3dce-e697-48c5-b39b-0cd56941489a
date: 2026-02-11 10:39:05
card: 
order: 3
tags:
---

在 Go 语言中，我们经常使用类似 `s[2:4]` 的语法来截取切片。你是否想过，这个操作会引发底层数组的拷贝吗？如果不会，它又是如何高效地返回一个新的切片视图的？

事实上，切片截取操作并不会发生底层数组的拷贝，而是直接引用原数组的内存地址。也就是说，`s[2:4]` 和 `s` 共享同一个底层数组。

## [官方背书](https://go.dev/blog/slices-intro#slice-internals)

关于这一点，Go 官方博客给出了明确的解释：

> Slicing does not copy the slice’s data. It creates a new slice value that points to the original array. This makes slice operations as efficient as manipulating array indices. Therefore, modifying the elements (not the slice itself) of a re-slice modifies the elements of the original slice
>
> 切片操作不会复制切片的数据。它会创建一个指向原始数组的新切片值。这使得切片操作与操作数组索引一样高效。因此，修改重新切片的元素 （而不是切片本身）会修改原始切片的元素。

![[1770778663.excalidraw.png]]

## 简单验证

既然官方明确表示修改截取后的切片元素会影响原切片，我们不妨通过一段简单的代码来验证这个结论：

```go
package main

import "fmt"

func main() {
	s := make([]int, 5)

	// slicing
	t := s[2:4]
	// modify
	t[0], t[1] = 1, 2

	// print
	fmt.Printf("s: %v\n", s)
}

----
s: [0 0 1 2 0]
```

可以看到，对切片 `t` 的修改，确实直接反映在了原切片 `s` 上。

## 深入底层验证

为了更严谨地证明它们共享同一块内存，我们可以借助 `unsafe` 包直接打印出底层数组的内存地址。

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	s := make([]int, 5)
	array := unsafe.SliceData(s)
	pointer := unsafe.Pointer(array)
	for i := 0; i < 5; i++ {
		pointer = unsafe.Add(pointer, unsafe.Sizeof(int(0)))
		fmt.Printf("&s[%d]: %v\n", i, pointer)
	}

	// slicing
	t := s[2:4]
	array = unsafe.SliceData(t)
	pointer = unsafe.Pointer(array)
	for i := 0; i < 2; i++ {
		pointer = unsafe.Add(pointer, unsafe.Sizeof(int(0)))
		fmt.Printf("&t[%d]: %v\n", i, pointer)
	}
}
```

```text {3,4,6,7}
&s[0]: 0x140000b4038
&s[1]: 0x140000b4040
&s[2]: 0x140000b4048
&s[3]: 0x140000b4050
&s[4]: 0x140000b4058
&t[0]: 0x140000b4048
&t[1]: 0x140000b4050
```

观察输出结果，`t[0]` 和 `t[1]` 的物理地址与 `s[2]` 和 `s[3]` 完全一致。这从底层证实了切片截取操作的高效性：它仅仅是创建了一个新的切片描述符（包含新的指针、长度和容量），而没有进行任何数据的拷贝。