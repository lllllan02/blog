---
title: 信号量 (Semaphore)
aliases: a069929d-06f3-4f20-ad72-882a5c51cc61
date: 2026-03-16 16:07:53
card: true
order:
tags: [wiki]
wiki: [信号量, Semaphore]
---

**信号量**是一个用于多进程或多线程环境下控制对共享资源访问的整型变量。它通过 `P`（Wait/Down，尝试获取资源）和 `V`（Signal/Up，释放资源）两种原子操作来改变其值，从而实现任务间的互斥或同步。

## 核心直觉

信号量就像是一个停车场门口的电子显示屏，显示还有多少个空车位。车进场（`P` 操作）车位减一，车出场（`V` 操作）车位加一。如果显示 0，后面的车就得在门口排队等候，直到有车离开。

## 关键点

- **互斥信号量 (Binary Semaphore)**：值只能为 0 或 1，类似于互斥锁（Mutex），用于保护单一临界区。
- **计数信号量 (Counting Semaphore)**：值可以大于 1，用于管理具有多个可用实例的资源池。
- **原子性**：`P` 和 `V` 操作必须是不可中断的原子操作，以防止竞态条件。

## 参考资料

- [Semaphore (programming) - Wikipedia](https://en.wikipedia.org/wiki/Semaphore_(programming))