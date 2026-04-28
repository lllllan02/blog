---
title: 最短任务优先 (Shortest Job First)
wiki: ["最短任务优先", "SJF"]
aliases: 52A13168-F081-4B9D-A08D-5EF386372A38
date: 2026-02-24 16:55:00
card: true
order:
tags:
  - wiki
  - ostep
  - scheduling
---

## 定义

**最短任务优先 (Shortest Job First, SJF)** 是一种调度策略，它优先执行预计运行时间最短的任务。

## 直观理解

SJF 的直觉是：如果短任务很多，让它们先完成，可以避免它们排在长任务后面一起等待，从而降低平均周转时间。它是缓解护航效应的一种经典思路。

## 关键点

- **周转时间优化**：在所有任务同时到达的情况下，SJF 是最优的调度算法，能最小化平均响应时间。
- **非抢占性**：传统的 SJF 是非抢占的，一旦长任务开始运行，即使有更短的任务到达，也必须等待长任务完成。
- **饥饿问题**：如果系统中不断有短任务到达，长任务可能会永远得不到执行。

## 参考资料

- [Scheduling: Introduction - OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf)
