---
title: 饿死 (Starvation)
aliases: b022ffde-7d9a-4c14-8d14-c359905a3f6c
date: 2026-03-03 11:09:31
wiki: [饿死, Starvation, 资源饥饿]
tags: [OS, Concurrency, Scheduling]
card: true
---

**饿死 (Starvation)** 是并发计算中的一种现象，指进程或线程因无法获取所需的资源（如 CPU 时间、内存、I/O），导致其任务被无限期推迟执行。

## 核心直觉

饿死通常源于**资源分配策略的不公平**。就像在食堂排队打饭，如果规则允许插队（高优先级抢占），那么老实排队的人（低优先级）可能永远也打不到饭。

-   **与死锁的区别**：死锁是大家互相卡住谁也动不了（Circular Wait）；饿死是系统整体在运行，但某个倒霉蛋一直没机会运行。
-   **常见原因**：过于激进的优先级调度算法（总是优先处理高优先级任务），或者资源竞争过于激烈且缺乏公平锁机制。

## 解决方案

-   **老化 (Aging)**：随着等待时间的增加，逐渐提高进程的优先级，确保它最终能获得资源。
-   **公平调度**：使用先来先服务 (FCFS) 或轮转调度 (Round Robin) 等公平算法。

## 参考

- [Starvation (computer science) - Wikipedia](https://en.wikipedia.org/wiki/Starvation_(computer_science))
