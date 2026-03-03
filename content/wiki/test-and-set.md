---
title: 测试并设置 (Test-and-Set)
aliases: 75788979-3fff-4af6-99e2-73e528648dc6
date: 2026-03-03 11:15:47
wiki: [测试并设置, Test-and-Set, TAS]
tags: [OS, Concurrency, Hardware]
card: true
---

## 定义

**测试并设置 (Test-and-Set, TAS)** 是一种硬件原子指令，用于实现互斥锁。它能在单个不可中断的操作中，读取一个内存位置的旧值，并**无条件**地将其设置为新值（通常是 1）。

## 直觉

想象一个带有旗帜的旋转门。当你通过时，你**同时**做两件事：
1.  **读取**旗帜当前的状态（Test）。
2.  无论之前状态如何，都把旗帜**升起**（Set）。

如果旗帜原本是放下的（返回 0），说明你成功抢到了锁；如果旗帜原本就是升起的（返回 1），说明别人已经抢占了，你只能等待。

## 关键点

-   **无条件写入 (Unconditional)**: 与 CAS 不同，TAS 不检查旧值是否符合预期，而是直接覆盖写入。
-   **自旋锁基础**: 它是实现自旋锁 (Spinlock) 最基础的原语，但在高争用下可能导致性能问题。
-   **表达能力较弱**: 它的共识数 (Consensus Number) 为 2，意味着它无法解决超过 2 个线程的通用共识问题，不如 CAS 强大。

## 参考资料

- [Test-and-set - Wikipedia](https://en.wikipedia.org/wiki/Test-and-set)
