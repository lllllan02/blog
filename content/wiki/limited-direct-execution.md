---
title: 受限直接执行 (Limited Direct Execution)
wiki: ["受限直接执行", "LDE"]
aliases: 42433B3A-1AE1-4373-8ECD-4FF14611111C
date: 2026-02-24 16:45:00
card: true
tags:
  - wiki
  - ostep
  - virtualization
---

## 定义

> **受限直接执行（LDE）是一种操作系统在保证自身控制权的前提下，让程序直接在 CPU 上高效运行的机制。**

它是 CPU 虚拟化的核心协议：通过让程序“直接执行”来获得高性能，同时通过硬件提供的“受限”机制（如用户态/内核态、陷阱表）确保操作系统能随时夺回控制权并限制程序执行特权操作。

## 核心机制

- **特权级分离**：硬件区分用户态（User Mode）和内核态（Kernel Mode），限制用户程序直接访问硬件。
- **陷阱 (Trap)**：程序通过系统调用触发陷阱进入内核态，由操作系统代为执行特权操作。
- **时钟中断**：操作系统利用硬件定时器定期夺回 CPU 控制权，从而实现多任务切换。

## 参考

- [Limited Direct Execution - OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf)
