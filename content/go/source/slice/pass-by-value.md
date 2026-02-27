---
title: 值传递与"修改生效"
aliases: c5d6e7f8-9a0b-4c1d-8e2f-3a4b5c6d7e8f
date: 2026-02-12 16:00:00
card: true
order: 5
tags:
  - golang
  - slice
  - go1.21
  - source-reading
---

Go 函数传参是**值传递**：传入的切片会被拷贝一份。但修改切片元素却能影响调用方的原切片，原因在于拷贝的是「切片头」，而不是底层数组。

## 本质：拷贝的是切片头

切片在底层是一个包含三个字段的结构体，见 [[2d6c3a7f-f32c-4dcd-9491-374a0bc6359e|底层结构]]：

```go
type slice struct {
    array unsafe.Pointer  // 指向底层数组
    len   int
    cap   int
}
```

传参时，**整个切片头**（约 24 字节）被拷贝到函数栈上，而底层数组不在栈上，不会被拷贝。

- 调用方切片 `s` 和形参 `s` 各自持有一份切片头
- 两份切片头的 `array` 指向**同一块底层数组**
- 因此 `s[i] = x` 修改的是共用数组，调用方可见

## 修改元素 vs 修改切片本身

| 操作 | 是否影响调用方 | 原因 |
|------|----------------|------|
| `s[i] = x` | 是 | 改的是底层数组，双方共享 |
| `s = s[:0]` | 否 | 只改形参的 `len`，调用方的切片头不变 |
| `s = append(s, x)` 且触发扩容 | 否 | 新数组只存在形参的切片头里，调用方仍指旧数组 |

## 简单验证

```go
package main

import "fmt"

func modifyElem(s []int) {
    s[0] = 999  // 修改元素 → 影响调用方
}

func modifySlice(s []int) {
    s = s[:0]   // 修改切片本身 → 不影响调用方
}

func main() {
    s := []int{1, 2, 3}
    modifyElem(s)
    fmt.Println(s)  // [999 2 3]

    s = []int{1, 2, 3}
    modifySlice(s)
    fmt.Println(s)  // [1 2 3]，不变
}
```
