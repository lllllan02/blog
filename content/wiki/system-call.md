---
title: 系统调用 (System Call)
wiki: ["系统调用", "Syscall", "Kernel Call"]
aliases: [F0E8BD81-FD2F-4C4E-AED6-3E107CC46A69]
date: 2026-02-25 10:05:00
card: true
order:
tags:
  - wiki
  - operating-system
---

## 定义

**系统调用 (System Call)** 是用户程序向操作系统内核请求服务（如硬件访问、进程管理）的编程接口。

## 直观理解

它是连接用户空间（User Space）和内核空间（Kernel Space）的桥梁。就像去银行办理业务（取钱、转账）必须通过柜台窗口一样，普通程序不能直接操作硬件，必须通过“系统调用”这个窗口请求内核代为执行。

## 关键点

- **权限切换**：执行系统调用时，CPU 会从用户态 (User Mode) 切换到内核态 (Kernel Mode)。
- **保护机制**：防止用户程序随意访问硬件或破坏系统稳定性。
- **常见例子**：`fork()` 创建进程，`read()` 读取文件，`write()` 写入文件。

## 参考资料

- [System call - Wikipedia](https://en.wikipedia.org/wiki/System_call)
