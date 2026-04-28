---
title: 多级反馈队列 (Multi-Level Feedback Queue)
wiki: ["多级反馈队列", "MLFQ"]
aliases: 51903ac0-94e5-4280-8411-3f0206c15842
date: 2026-02-24 15:40:00
card: true
order:
tags:
  - wiki
  - os
---

## 定义

**多级反馈队列 (Multi-Level Feedback Queue, MLFQ)** 是一种 CPU 调度算法，它通过多个不同优先级的队列，并根据进程运行历史动态调整优先级。

## 直观理解

MLFQ 的核心在于“学习历史以预测未来”。它试图解决一个矛盾：既要让短任务和交互式任务快速响应，又要让长任务稳步推进，而调度器事先并不知道每个任务会运行多久。

## 关键点

- **动态优先级**: 新进程默认进入最高优先级队列。如果它用完了时间片还没结束，说明它可能是个“长任务”，于是被降级到低优先级队列。
- **反馈机制**: 如果一个进程频繁放弃 CPU（如等待 I/O），它会被留在高优先级队列，因为它看起来像是个“交互式任务”。
- **优先级提升 (Priority Boost)**: 为了防止长任务在底层队列饿死，系统会定期将所有进程移回最高优先级队列。

## 参考资料

- [Scheduling: The Multi-Level Feedback Queue - OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf)
