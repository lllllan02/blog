---
title: 进程标识符 (Process Identifier)
wiki: ["进程标识符", "PID", "Process ID"]
aliases: [6B5ADDDA-1050-4BDE-B38C-21E8ABB81C1D]
date: 2026-02-25 10:00:00
card: true
tags:
  - wiki
  - operating-system
---

## 定义

> **进程标识符 (PID)** 是操作系统内核分配给每个运行进程的唯一数值标识，用于区分系统中的不同进程。

就像身份证号一样，PID 是进程在系统中的唯一“身份证明”，操作系统通过它来管理、调度和监控特定的进程。

- **唯一性**: 在同一时刻，系统中的每个进程都有一个独一无二的 PID。
- **生命周期**: 进程终止后，其 PID 会被回收并可能分配给新的进程。
- **特殊 PID**: PID 1 通常是 `init` 进程（或 systemd），是所有其他进程的祖先。

## 参考

- [Process identifier - Wikipedia](https://en.wikipedia.org/wiki/Process_identifier)
