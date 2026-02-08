---
title: Go 源码阅读：Slice
aliases: 8d2e1c3a-9b4d-4f6d-a1c2-7b3a4f5d6e7f
date: 2026-02-08 14:45:00
tags:
  - golang
  - source-reading
  - slice
---

> 本文档旨在引导你自主阅读 Go `slice` 的源码。建议阅读路径：`src/runtime/slice.go`。

## 推荐阅读

- [ ] [Go 语言设计与实现 - 切片](https://draven.co/golang/docs/part2-foundation/ch03-datastructure/golang-array-and-slice/)：最经典的中文源码解析，图文并茂。
- [ ] [Go Slices: usage and internals](https://go.dev/blog/slices-intro)：官方博客，理解切片设计的初衷。
- [ ] [深度解密 Go 语言之 Slice](https://www.qcrao.com/2019/04/02/dive-into-go-slice/)：qcrao 的深度解析系列，非常适合配合源码阅读。
- [ ] [Go 1.18 扩容策略的变化 (GitHub Commit)](https://github.com/golang/go/commit/2dda92ff6f9f07eeb110ecbf0fc2d7a0ddd27f9d)：这是 Go 官方修改扩容逻辑的提交记录，包含了详细的设计说明和公式演变。
- [ ] [Go 1.18 扩容机制解析](https://www.codegenes.net/blog/how-the-slice-is-enlarged-by-append-is-the-capacity-always-doubled/)：详细对比了 1.18 前后 `growslice` 的算法差异。

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
