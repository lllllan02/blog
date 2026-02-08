---
title: Go 源码阅读：Slice
aliases: 8d2e1c3a-9b4d-4f6d-a1c2-7b3a4f5d6e7f
date: 2026-02-08 11:00:00
tags:
  - golang
  - source-reading
  - slice
---

> 本文档旨在引导你自主阅读 Go `slice` 的源码。建议阅读路径：`src/runtime/slice.go`。

## 底层结构

```go
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
```

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

## 推荐阅读

- [x] [Go 语言设计与实现 - 切片](https://draven.co/golang/docs/part2-foundation/ch03-datastructure/golang-array-and-slice/)：最经典的中文源码解析，图文并茂。
- [x] [Go Slices: usage and internals](https://go.dev/blog/slices-intro)：官方博客，理解切片设计的初衷。
- [ ] [深度解密 Go 语言之 Slice](https://www.qcrao.com/2019/04/02/dive-into-go-slice/)：qcrao 的深度解析系列，非常适合配合源码阅读。
- [ ] [Go 1.18 扩容策略的变化 (GitHub Commit)](https://github.com/golang/go/commit/2dda92ff6f9f07eeb110ecbf0fc2d7a0ddd27f9d)：这是 Go 官方修改扩容逻辑的提交记录，包含了详细的设计说明和公式演变。
- [ ] [Go 1.18 扩容机制解析](https://www.codegenes.net/blog/how-the-slice-is-enlarged-by-append-is-the-capacity-always-doubled/)：详细对比了 1.18 前后 `growslice` 的算法差异。
- [ ] [码洞「切片」的三种特殊状态](https://juejin.im/post/5bea58df6fb9a049f153bca8)
- [ ] [老钱 数组](https://juejin.im/post/5be53bc251882516c15af2e0)
- [ ] [老钱 切片](https://juejin.im/post/5be8e0b1f265da614d08b45a)
- [ ] [golang interface源码](https://i6448038.github.io/2018/10/01/Golang-interface/)
- [ ] [golang interface源码](http://legendtkl.com/2017/07/01/golang-interface-implement/)
- [ ] [interface](https://www.jishuwen.com/d/2C9z#tuit)
- [ ] [雨痕开源Go学习笔记](https://github.com/qyuhen/book)
- [ ] [slice 图很漂亮](https://halfrost.com/go_slice/)
- [ ] [slice 扩容规则](https://jodezer.github.io/2017/05/golangSlice%E7%9A%84%E6%89%A9%E5%AE%B9%E8%A7%84%E5%88%99)
- [ ] [slice 作为参数](https://www.cnblogs.com/fwdqxl/p/9317769.html)
- [ ] [源码](https://ictar.xyz/2018/10/25/%E6%B7%B1%E5%85%A5%E6%B5%85%E5%87%BA-go-slice/)
- [ ] [append机制 译文](https://brantou.github.io/2017/05/24/go-array-slice-string/)
- [ ] [slice 汇编](http://xargin.com/go-slice/)
- [ ] [slice tricks](https://colobu.com/2017/03/22/Slice-Tricks/)
- [ ] [有图](https://i6448038.github.io/2018/08/11/array-and-slice-principle/)
- [ ] [slice的本质](https://www.flysnow.org/2018/12/21/golang-sliceheader.html)
- [ ] [slice使用技巧](https://blog.thinkeridea.com/201901/go/slice_de_yi_xie_shi_yong_ji_qiao.html)
- [ ] [slice/array、内存增长](https://blog.thinkeridea.com/201901/go/shen_ru_pou_xi_slice_he_array.html)

## 核心结构与基础
在开始阅读代码前，请先思考并尝试在源码中找到以下问题的答案：

- [ ] **内存布局**：`slice` 在底层是如何定义的？（寻找 `slice` 结构体）
- [ ] **空切片 vs 零值切片**：`var s []int` 和 `s := []int{}` 在底层表示上有什么区别？
- [ ] **切片截取**：执行 `s2 := s1[1:3]` 时，底层发生了什么？是否发生了内存拷贝？

## 重点函数：growslice
这是切片扩容的核心逻辑，位于 `src/runtime/slice.go`。阅读时请关注：

- [ ] **扩容策略**：
    - 在 Go 1.18 之后，扩容阈值从 1024 变成了多少？
    - 为什么不再是简单的“翻倍”？
- [ ] **内存对齐（Round Up）**：
    - 扩容计算出的新容量（`newcap`）就是最终申请的内存大小吗？
    - 寻找代码中关于 `roundupsize` 的调用，理解它如何根据内存规格调整容量。
- [ ] **写屏障与内存拷贝**：
    - 扩容后旧数据是如何迁移到新内存的？（寻找 `memmove`）

## 进阶思考
- [ ] **切片作为参数**：为什么说 Go 函数传参是“值传递”，但修改切片元素却能影响原切片？
- [ ] **内存泄露风险**：在大切片上截取小切片，为什么可能导致内存泄露？源码中是否有相关提示或你能想到的避坑指南？
