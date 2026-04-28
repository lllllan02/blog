---
title: 饿死 (Starvation)
aliases: b022ffde-7d9a-4c14-8d14-c359905a3f6c
date: 2026-03-03 11:09:31
wiki: [饿死, Starvation, 资源饥饿]
tags: [OS, Concurrency, Scheduling]
card: true
order:
---

## 定义

**饿死 (Starvation)** 是并发计算中的一种现象，指进程或线程因无法获取所需的资源（如 CPU 时间、内存、I/O），导致其任务被无限期推迟执行。

## 直观理解

饿死通常源于**资源分配策略的不公平**。就像在食堂排队打饭，如果规则允许插队（高优先级抢占），那么老实排队的人（低优先级）可能永远也打不到饭。

## 关键点

- **与死锁的区别**：死锁是多个任务互相等待而都无法推进；饿死是系统整体仍在运行，但某个任务一直没有机会运行。
- **常见原因**：过于激进的优先级调度，或资源竞争激烈且缺少公平机制。
- **缓解方式**：老化 (Aging) 会随着等待时间增加逐渐提高任务优先级，避免长期等待。

## 参考资料

- [Starvation (computer science) - Wikipedia](https://en.wikipedia.org/wiki/Starvation_(computer_science))
