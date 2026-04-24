---
title: Go 源码阅读：Slice
aliases: 8d2e1c3a-9b4d-4f6d-a1c2-7b3a4f5d6e7f
date: 2026-02-08 11:00:00
card: true
order: 2
tags:
  - golang
  - source-reading
  - slice
  - go1.21
---

本系列深入解析 Go 1.21 [Slice 源码 (`src/runtime/slice.go`)](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/slice.go)，从底层结构到工程实践，揭示其“零拷贝”背后的性能优势与内存权衡。

## 1. 结构与状态

- **[[2d6c3a7f-f32c-4dcd-9491-374a0bc6359e|底层结构]]**：解析 `array`、`len` 和 `cap` 字段，理解切片固定 24 字节（64 位）的描述符本质。
- **[[87762e95-d4ca-4a3a-b0f2-07f81fc4b6fb|零切片｜空切片｜nil 切片]]**：对比运行时内存状态分歧，理解 `zerobase` 机制及其在 JSON 序列化和 API 中的行为差异。
- **[[c5d6e7f8-9a0b-4c1d-8e2f-3a4b5c6d7e8f|值传递与修改生效]]**：剖析“切片头”拷贝机制，解答修改切片元素与 `append` 扩容时对原切片的不同影响。

## 2. 核心机制：扩容与截取

- **[[8c6749b6-458a-4aed-9ac1-bf582271a7fd|Slice 扩容机制 (growslice)]]**：深度拆解切片动态扩容的全流程：
  - **容量计算**：Go 1.18 引入的平滑过渡公式（取代单一翻倍阈值）。
  - **内存对齐**：`roundupsize` 如何匹配分配器内存规格（Size Classes）以减少内存碎片。
  - **GC 协同**：并发标记下的写屏障（Shade）保护与新内存清零策略。
- **[[b3ea3dce-e697-48c5-b39b-0cd56941489a|切片截取与内存泄漏]]**：验证截取操作的零拷贝（Zero-copy）特性，揭示小切片拖拽大数组导致的内存泄漏隐患及指针游离问题。

## 3. 设计背景参考

- **官方设计哲学**：[[b320f328-f1d8-4c4d-a5e0-edba5660b9dd|Go Slices: usage and internals]]
- **扩容策略演进**：[Go 1.18 扩容策略推导 (GitHub Commit)](https://github.com/golang/go/commit/2dda92ff6f9f07eeb110ecbf0fc2d7a0ddd27f9d)
