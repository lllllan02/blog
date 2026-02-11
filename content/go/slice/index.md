---
title: Go 源码阅读：Slice
aliases: 8d2e1c3a-9b4d-4f6d-a1c2-7b3a4f5d6e7f
date: 2026-02-08 11:00:00
order: 2
tags:
  - golang
  - source-reading
  - slice
  - go1.21
---

> 本文档旨在引导你自主阅读 Go 1.21 的 [slice 源码](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/slice.go)

把下面内容当作阅读源码前的准备清单与思考题。

## 推荐阅读

- [x] [Go Slices: usage and internals](https://go.dev/blog/slices-intro)：官方视角的切片设计背景，建议先读以对齐术语。
- [x] [Go 1.18 扩容策略的变化 (GitHub Commit)](https://github.com/golang/go/commit/2dda92ff6f9f07eeb110ecbf0fc2d7a0ddd27f9d)：官方改动说明与推导过程，理解扩容策略的关键来源。

## 核心结构与基础

在开始阅读代码前，请先思考并尝试在源码中找到以下问题的答案：

- [x] [[2d6c3a7f-f32c-4dcd-9491-374a0bc6359e|底层结构]]：slice 在底层是如何定义的？
- [x] [[87762e95-d4ca-4a3a-b0f2-07f81fc4b6fb|零切片｜空切片｜nil 切片]]：切片的各种创建方式在底层上有什么区别？
- [x] [[b3ea3dce-e697-48c5-b39b-0cd56941489a|切片截取]]：执行 `t := s[2:4]` 时，底层发生了什么？是否发生了内存拷贝？

## 重点函数：growslice
这是切片扩容的核心逻辑，位于 `src/runtime/slice.go`。阅读时请关注：

- [x] [[8c6749b6-458a-4aed-9ac1-bf582271a7fd#扩容策略|扩容策略]]：
    - 在 Go 1.18 之后，扩容阈值从 1024 变成了多少？
    - 为什么不再是简单的“翻倍”？
- [x] [[8c6749b6-458a-4aed-9ac1-bf582271a7fd#内存对齐|内存对齐（Round Up）]]：
    - 扩容计算出的新容量（`newcap`）就是最终申请的内存大小吗？
    - 寻找代码中关于 `roundupsize` 的调用，理解它如何根据内存规格调整容量。
- [x] [[8c6749b6-458a-4aed-9ac1-bf582271a7fd#内存清零与写屏障|写屏障与内存拷贝]]：
    - 扩容后旧数据是如何迁移到新内存的？（寻找 `memmove`）

## 进阶思考
- [ ] **切片作为参数**：为什么说 Go 函数传参是“值传递”，但修改切片元素却能影响原切片？
- [ ] **内存泄露风险**：在大切片上截取小切片，为什么可能导致内存泄露？源码中是否有相关提示或你能想到的避坑指南？
