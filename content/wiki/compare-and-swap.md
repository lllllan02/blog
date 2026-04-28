---
title: 比较并交换 (Compare and Swap)
aliases: 6d8d75c9-e6fd-4c09-9f1e-639c5c71e1db
date: 2026-03-03 11:18:28
card: true
order:
wiki: [CAS, 比较并交换, Compare and Swap]
tags: [Concurrency, Synchronization]
---

## 定义

**比较并交换 (Compare and Swap, CAS)** 是一种用于多线程同步的原子指令。它将内存位置的内容与给定值进行比较，仅当两者相等时，才将该内存位置的内容修改为新的给定值。

## 直观理解

CAS 解决了并发编程中“读-改-写”操作的竞态条件问题，是**乐观锁**的实现基础。

与 Test-and-Set (TAS) 的“盲目覆盖”不同，CAS 是“有条件的更新”：它要求更新时值必须未被修改过。如果发现冲突（值已被其他线程修改），操作失败并通常进行重试（自旋）。

## 关键点

-   **更强的表达能力**: CAS 的共识数 (Consensus Number) 为 $\infty$，比 TAS 更强大，是实现无锁 (Lock-Free) 和无等待 (Wait-Free) 数据结构的核心。
-   **ABA 问题**: 如果一个值从 A 变为 B 又变回 A，CAS 会误认为它没有变化。通常通过引入版本号（Version/Stamp）来解决。
-   **原子性**: 硬件保证比较和交换的整个过程是不可分割的。

## 参考资料

-   [Compare-and-swap - Wikipedia](https://en.wikipedia.org/wiki/Compare-and-swap)
