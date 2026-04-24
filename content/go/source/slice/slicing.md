---
title: 切片截取与内存泄漏
aliases: 
  - b3ea3dce-e697-48c5-b39b-0cd56941489a
  - a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
date: 2026-02-11 10:39:05
order: 3
tags:
  - golang
  - slice
  - go1.21
  - source-reading
  - memory-leak
---


在 Go 中，切片截取（如 `s[2:4]`）是一种 **零拷贝（Zero-copy）** 操作，新切片直接复用原切片的底层数组。这种设计极大提升了性能，但也埋下了隐患：只要截取后的小切片还在使用，整个庞大的底层数组就不会被垃圾回收（GC）。在处理大文件或长生命周期对象时，这种机制极易引发严重的内存泄漏。

## 机制验证：共享底层数组

为什么 `s[2:4]` 这样简单的操作，会成为 Go 中最臭名昭著的内存泄漏陷阱？我们需要先从它的底层机制说起。

[Go 官方博客](https://go.dev/blog/slices-intro#slice-internals) 对切片截取有明确的定义：
> Slicing does not copy the slice’s data. It creates a new slice value that points to the original array.
> （切片操作不会复制数据。它会创建一个指向原始数组的新切片值。）

这意味着，当我们执行截取时，Go 仅仅是创建了一个新的切片描述符（包含新的指针、长度和容量），而没有发生任何数据的深度拷贝（Deep Copy）。我们可以通过 `unsafe` 包来验证这一结论：

```go
// 适用于 Go 1.21+
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	s := make([]int, 5)
	// slicing
	t := s[2:4]
	
	// 修改截取后的切片
	t[0] = 99
	fmt.Printf("s: %v\n", s) // s[2] 也变成了 99
	
	// 打印物理地址
	fmt.Printf("&s[2]: %p\n", &s[2])
	fmt.Printf("&t[0]: %p\n", &t[0]) // 两者地址完全一致
}
```

![[1770778663.excalidraw.png]]

## 真实案例：被拖住的庞然大物

这种零拷贝机制带来了一个致命的副作用：**小切片会“拖住”大数组**。

假设我们将一个 100MB 的日志文件完整读入 `[]byte`，然后使用正则表达式找到其中仅占 10KB 的关键报错信息并返回。由于返回的 10KB 切片依然持有那 100MB 底层数组的指针，垃圾回收器（GC）会认为整个 100MB 数组仍处于活跃状态，导致其永远无法被回收。

Go 官方博客提供了一个典型的反例 `FindDigits`：

```go
func FindDigits(filename string) []byte {
    b, _ := ioutil.ReadFile(filename)
    // 危险：返回的切片引用了整个 b 的底层数组
    return regexp.MustCompile("[0-9]+").Find(b)
}
```

### 隐蔽陷阱：指针切片的游离对象

当切片的元素是指针类型时，情况会变得更加复杂。

假设我们对一个指针切片执行 `s = s[:n]` 截断操作，期望“删除”末尾的元素。表面上看切片长度变短了，但实际上 `s[n:cap(s)]` 范围内的指针元素依然保留在底层数组中。由于这些废弃的指针仍指向堆中的具体对象，GC 无法回收这些对象，造成了无形的内存泄漏。

这正是 `slices` 包在 `Delete` 函数源码中留下警告的原因：

```go
// src/slices/slices.go
// Delete might not modify the elements s[len(s)-(j-i):len(s)]. If those
// elements contain pointers you might consider zeroing those elements so that
// objects they reference can be garbage collected.
func Delete[S ~[]E, E any](s S, i, j int) S
```

## 权衡取舍 (Trade-offs) 与最佳实践

Go 语言在设计切片截取时，选择了**极致的性能（CPU）**，但也把 **内存管理（Memory）** 的责任转移给了开发者。为了在这两者之间取得平衡，我们需要在不同的场景下采取对应的防御性策略。

### 策略一：明确解耦（深拷贝）

当我们只需要保留大数组中的极小部分，并期望快速释放大数组时，必须通过分配新内存来彻底切断引用联系。

:::tabgroup
=== copy()
最传统直观的方法，手动分配所需长度的新切片并拷贝。
```go
func copySlice(arr []int, start, end int) []int {
    newArr := make([]int, end-start)
    copy(newArr, arr[start:end])
    return newArr
}
```
=== slices.Clone()
Go 1.21+ 推荐的优雅解法，底层通过 `append` 触发 `growslice` 实现深拷贝。
```go
func cloneSlice(arr []int, start, end int) []int {
    return slices.Clone(arr[start:end])
}
```
=== append() Hack
巧妙利用 `append` 到空切片触发扩容的机制进行复制（即 `slices.Clone` 的底层原理）。
```go
func appendSlice(arr []int, start, end int) []int {
    return append([]int{}, arr[start:end]...)
}
```
:::

### 策略二：手动清零（针对指针切片）

在对指针切片执行缩容或删除操作后，务必将不再使用的废弃元素置为 `nil`，帮助 GC 断开对象引用。

```go
func deletePointers(s []*int, i, j int) []*int {
    // 1. 移动元素覆盖被删除部分
    copy(s[i:], s[j:])
    // 2. 将尾部废弃的元素手动置为 nil
    for k := len(s) - (j - i); k < len(s); k++ {
        s[k] = nil
    }
    // 3. 调整长度
    return s[:len(s)-(j-i)]
}
```

通过理解切片截取的底层运作方式，我们可以避免编写出带性能隐患的代码，在享受“零拷贝”红利的同时，确保系统的内存健康。