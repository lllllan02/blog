---
title: 时钟中断 (Timer Interrupt)
wiki: ["时钟中断", "Timer Interrupt"]
aliases: [AD4B4608-925B-468B-B90B-271C5CA5B73A]
date: 2026-02-25 10:10:00
card: true
order:
tags:
  - wiki
  - operating-system
---

## 定义

**时钟中断 (Timer Interrupt)** 是由硬件定时器定期产生的信号，它让 CPU 暂停当前程序，转而执行操作系统的中断处理程序。

## 直观理解

就像学校里的上下课铃声，时钟中断是操作系统掌控时间节奏的关键机制。它确保操作系统能够定期重新获得 CPU 的控制权，防止某个程序独占 CPU。

## 关键点

- **抢占式多任务**：当一个进程的时间片用完时，时钟中断会触发调度器切换到下一个进程。
- **时间管理**：操作系统利用它更新系统时间、统计进程运行时间。
- **夺回控制权**：即使程序陷入死循环，时钟中断也能让操作系统重新获得执行机会。

## 参考资料

- [Programmable interval timer - Wikipedia](https://en.wikipedia.org/wiki/Programmable_interval_timer)
