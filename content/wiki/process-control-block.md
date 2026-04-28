---
title: 进程控制块 (Process Control Block)
wiki: ["进程控制块", "PCB", "Process Control Block"]
aliases: 8D644492-0B81-457C-B11B-8D7540B67327
date: 2026-02-25 00:00:00
card: true
order:
tags:
  - wiki
---

## 定义

**进程控制块 (Process Control Block, PCB)** 是操作系统内核中描述进程状态的数据结构，是系统管理进程的核心记录。

## 直观理解

它就像进程的“身份证”和“档案袋”，记录了进程运行所需的所有信息（如 PID、寄存器值、内存指针），让操作系统在切换进程时能保存现场并恢复执行。

## 关键点

- **唯一标识**：每个进程有且仅有一个 PCB。
- **包含信息**：进程标识符、寄存器状态、调度信息、内存指针等。
- **生命周期**：随进程创建而建立，随进程终止而回收。

## 参考资料

- [Process control block - Wikipedia](https://en.wikipedia.org/wiki/Process_control_block)
