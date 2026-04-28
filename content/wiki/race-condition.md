---
title: 竞态条件 (Race Condition)
wiki: ["竞态条件"]
aliases: B4F8523E-0A1F-4FFC-909E-2C34FF53F4F0
date: 2026-02-26 12:05:00
card: true
order:
tags:
  - wiki
  - os
  - concurrency
---

## 定义

**竞态条件 (Race Condition)** 指的是程序结果依赖于不受控制的事件顺序或时机，导致行为不可预测且通常是错误的。

## 直观理解

当多个线程或进程**并发访问共享数据**，且至少有一个在进行**写操作**时，如果缺乏适当的同步机制（如临界区保护），最终结果就取决于谁“跑得快”（执行顺序）。

## 关键点

- **Check-Then-Act (检查后执行)**：基于过期的检查结果做决定（如：检查文件不存在 -> 创建文件，但中间被别的线程创建了）。
- **Read-Modify-Write (读-改-写)**：读取旧值 -> 修改 -> 写回，导致中间其他线程的更新被覆盖（丢失更新）。

## 参考资料

- [Race condition - Wikipedia](https://en.wikipedia.org/wiki/Race_condition)
