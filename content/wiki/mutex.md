---
title: 互斥量 (Mutex)
wiki: ["互斥量", "Mutual Exclusion", "Lock"]
aliases: 70f4439d-342f-47b4-ada8-5f653f2dfe18
date: 2026-03-03 10:17:03
card: true
order:
tags:
  - wiki
  - os
  - concurrency
---

## 定义

**互斥量 (Mutex)** 是一种用于多线程编程的同步原语，用于防止多个线程同时访问共享资源。

它通过**排他性**（Mutual Exclusion）机制，确保同一时刻只有一个线程能持有锁并执行临界区代码，其他试图获取锁的线程必须等待，直到锁被释放。

## 直观理解

就像**房间门的锁**：
- 房间里有共享资源（如打印机）。
- 同一时间只有一个人（线程）能拿到钥匙进入房间。
- 其他人必须在门外排队等待。
- 只有当里面的人出来并归还钥匙（释放锁），下一个人才能拿到钥匙进去。

## 关键点

- **排他性 (Exclusivity)**：任意时刻只能有一个线程持有锁。
- **原子性 (Atomicity)**：加锁和解锁操作通常依赖硬件原子指令（如 CAS, Test-and-Set）实现，不可被中断。
- **阻塞/自旋 (Blocking/Spinning)**：获取不到锁时，线程可能会阻塞（让出 CPU，进入睡眠状态）或自旋（忙等待，持续检查锁状态）。

## 参考资料

- [Mutual exclusion - Wikipedia](https://en.wikipedia.org/wiki/Mutual_exclusion)
