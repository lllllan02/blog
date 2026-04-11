---
title: 开放寻址法 (Open Addressing)
aliases: b4c670da-dcc3-4403-9284-21dfc52adaa2
date: 2026-04-11 15:37:02
card: true
order:
tags: [wiki]
wiki: [开放寻址法, Open Addressing]
---

## 定义

**开放寻址法 (Open Addressing)** 是一种解决哈希冲突的方法。当发生冲突时，它不会使用额外的数据结构（如链表），而是按照某种探测序列（Probing Sequence），在哈希表数组本身中寻找下一个空闲的位置来存储元素。

## 核心直觉

就像在一个拥挤的停车场找车位。如果你被分配的车位（哈希值）已经被占了，你不会在那个车位上搭个架子把车叠起来（链地址法），而是继续往前开，寻找下一个空车位（线性探测），或者跳着找（二次探测），直到找到为止。

## 关键点

- **探测策略**：常见的探测方法包括线性探测（Linear Probing，步长为 1）、二次探测（Quadratic Probing）和双重哈希（Double Hashing）。
- **缓存友好**：因为所有数据都连续存储在同一个数组中，没有指针跳转，所以对 CPU 缓存（Cache）非常友好，查询速度极快。
- **装载因子敏感**：当哈希表较满时（装载因子高），冲突概率急剧上升，容易产生“聚集（Clustering）”现象，导致性能严重退化。因此通常需要更早地触发扩容。

## 参考资料

- [Wikipedia: Open addressing](https://en.wikipedia.org/wiki/Open_addressing)