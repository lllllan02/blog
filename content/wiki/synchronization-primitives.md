---
title: 同步原语 (Synchronization Primitives)
wiki: ["同步原语"]
aliases: 610D8617-7A78-4DE0-8C88-257AFC1E162B
date: 2026-02-26 12:10:00
card: true
order:
tags:
  - wiki
  - os
  - concurrency
---

## 定义

**同步原语 (Synchronization Primitives)** 是操作系统或编程语言提供的底层机制，用于协调多个线程或进程的执行顺序，以确保共享资源的安全访问。

## 直观理解

它们就像交通信号灯和路标，指挥着“车辆”（线程）在“路口”（临界区）有序通行，防止“撞车”（竞态条件）。

## 关键点

- **互斥锁 (Mutex)**：确保同一时刻只有一个线程能访问资源（排他性）。
- **信号量 (Semaphore)**：控制同时访问资源的线程数量（如限流）。
- **条件变量 (Condition Variable)**：允许线程挂起等待，直到满足特定条件。
- **原子操作 (Atomic Operations)**：硬件层面的不可分割指令（如 CAS），是构建上层原语的基石。

## 参考资料

- [Synchronization (computer science) - Wikipedia](https://en.wikipedia.org/wiki/Synchronization_(computer_science))
