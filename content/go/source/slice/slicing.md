---
title: 切片截取
aliases: b3ea3dce-e697-48c5-b39b-0cd56941489a
date: 2026-02-11 10:39:05
card: 
order: 3
tags:
---

使用 `s[2:4]` 进行切片截取的时候，底层并不会发生数组的拷贝，而是直接引用原数组中的地址，即 `s[2:4]` 和 `s` 指向的是同一个底层数组。

## [官方背书](https://go.dev/blog/slices-intro#slice-internals)

> Slicing does not copy the slice’s data. It creates a new slice value that points to the original array. This makes slice operations as efficient as manipulating array indices. Therefore, modifying the elements (not the slice itself) of a re-slice modifies the elements of the original slice
>
> 切片操作不会复制切片的数据。它会创建一个指向原始数组的新切片值。这使得切片操作与操作数组索引一样高效。因此，修改重新切片的元素 （而不是切片本身）会修改原始切片的元素

![[1770778663.excalidraw.png]]

## 简单验证

如官网所说，修改重新切片的元素（而不是切片本身）会修改原始切片的元素。那我们只要修改重新切片的元素，然后打印原始切片，看看是否也会被修改。

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

## 底层验证

让我们尝试用 `unsafe` 包来获取两个切片的底层数组地址，看看是否指向同一个地址。

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