---
title: 转换检测缓冲区 (Translation Lookaside Buffer)
wiki: ["转换检测缓冲区", "TLB", "Translation Lookaside Buffer", "快表", "转址旁路缓存", "页表缓存"]
aliases: F0E555C2-533A-4C15-9286-52DADF7CF25D
date: 2026-02-25 00:00:00
card: true
order:
tags:
  - wiki
---

## 定义

**转换检测缓冲区 (Translation Lookaside Buffer, TLB)** 是 CPU 中用于缓存虚拟地址到物理地址映射关系的硬件缓存，是内存管理单元 (MMU) 的一部分。

## 直观理解

它就像是页表的“高速缓存”或“小抄”。因为直接访问内存中的页表非常慢（每次内存访问都需要额外的查表操作），TLB 利用程序的局部性原理，记住了最近使用过的地址映射，让 CPU 在大多数情况下能直接获取物理地址，无需查表。

## 关键点

- **核心作用**：加速虚拟地址到物理地址的转换，减少内存访问次数。
- **工作原理**：CPU 先查 TLB，命中 (Hit) 则直接得到物理地址；未命中 (Miss) 则查页表并更新 TLB。
- **上下文切换**：进程切换时，TLB 通常需要刷新 (Flush) 或通过 ASID 区分不同进程，以避免错误的地址转换。

## 参考资料

- [Translation lookaside buffer - Wikipedia](https://en.wikipedia.org/wiki/Translation_lookaside_buffer)
