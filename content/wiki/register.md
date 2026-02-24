---
title: 寄存器 (Processor Register)
wiki: ["寄存器"]
aliases: [FF1FE218-D917-4F68-9869-7D1F10FA70BF]
tags: [wiki, Hardware]
date: 2026-02-24
card: true
---

## 定义

> **寄存器是 CPU 内部极小但速度极快的数据存储单元，用于在指令执行期间暂存操作数、中间结果或控制信息。**

如果把 CPU 比作大厨，内存就是远处的冷库，而寄存器就是大厨手中的菜刀和案板。它是计算机存储层级结构中最顶端、延迟最低的部分，直接参与运算过程。

- **核心特性**：容量极小（通常仅几十个）、速度极快（与 CPU 同频）、成本极高。
- **常见类型**：
    - **通用寄存器**：暂存运算数据（如 EAX, RBX）。
    - **程序计数器 (PC)**：存储下一条指令的地址，是控制 CPU 执行流的“领航员”。
    - **堆栈指针 (SP)**：管理函数调用的内存堆栈。
    - **指令寄存器 (IR)**：存放当前正在执行的指令。
- **作用**：减少 CPU 访问内存（相对极慢）的次数，是指令集架构（ISA）的核心组成部分。

## 相关概念

- [[program-counter|程序计数器 (Program Counter)]]：寄存器的一种，专门负责寻址指令。

## 参考

- [Processor register - Wikipedia](https://en.wikipedia.org/wiki/Processor_register)
