---
title: 陷入 (Trap)
wiki: ["陷入"]
aliases: B156100D-7E5C-41DD-90AB-E5019447AB65
date: 2026-02-24 16:50:00
card: true
tags:
  - wiki
  - ostep
  - kernel
---

## 定义

> **陷入（Trap）是一种特殊的硬件指令，用于将程序的执行从用户态切换到内核态。**

它是实现系统调用的底层机制：当用户程序需要执行特权操作（如读写磁盘）时，必须通过“陷入”指令主动将控制权交给操作系统，由操作系统在受控的内核环境中代为执行。

## 核心机制

- **权限切换**：执行陷入指令后，CPU 会自动从受限的用户模式切换到拥有完全权限的内核模式。
- **陷阱表 (Trap Table)**：硬件根据操作系统在启动时预设的陷阱表，跳转到特定的内核处理程序。
- **状态保存**：硬件会保存当前的寄存器状态（如程序计数器、栈指针），以便操作系统执行完任务后能通过 `return-from-trap` 指令恢复程序运行。

## 参考

- [Mechanism: Limited Direct Execution - OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf)
