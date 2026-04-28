---
title: 临界区 (Critical Section)
wiki: ["临界区"]
aliases: 9C218C80-A1EF-4114-B41A-B9820DF63F43
date: 2026-02-26 12:00:00
card: true
order:
tags:
  - wiki
  - os
---

## 定义

**临界区 (Critical Section)** 指的是访问共享资源（如全局变量、文件、数据库等）的代码片段，该片段在同一时刻只能被一个线程或进程执行。

## 直观理解

为了避免**竞态条件 (Race Condition)**，必须通过同步机制（如互斥锁 Mutex、信号量 Semaphore）对临界区进行保护，确保**互斥访问 (Mutual Exclusion)**。就像是一个单人卫生间，一次只能进一个人，其他人必须在外面排队等待。

## 关键点

- **互斥 (Mutual Exclusion)**：同一时刻仅允许一个进程进入。
- **前进 (Progress)**：空闲让进，忙则等待。
- **有限等待 (Bounded Waiting)**：等待时间有限，防止饥饿。

## 参考资料

- [Critical section - Wikipedia](https://en.wikipedia.org/wiki/Critical_section)
