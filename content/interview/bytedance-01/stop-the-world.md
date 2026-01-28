---
title: Stop The World (STW)
aliases: 89726E92-B8A5-4DCC-8057-4B13B77586DB
date: 2026-01-28 11:38:01
card: true
order: 23
tags:
  - gc
  - runtime
  - golang
---

## 一句话定义

**Stop The World (STW)** 是垃圾回收中的一种状态，指为了保证内存标记或清理的准确性，运行时系统（Runtime）会暂时停止所有用户协程（Goroutine）的执行。

## 核心原理

在 Go 的垃圾回收过程中，STW 主要发生在两个关键时刻，用于切换 GC 的状态：

### 1. Mark Setup (准备标记)
- **目的**：开启[[17FC79C5-A4F7-44D2-ACA1-97CB216ADEE2|写屏障（Write Barrier）]]并扫描根对象（Root Scan）。
- **必要性**：必须确保所有处理器（P）都同步开启了写屏障，才能开始并发标记，否则会丢失引用。

### 2. Mark Termination (结束标记)
- **目的**：统计扫描结果，关闭写屏障，并计算下一次 GC 的触发阈值。
- **必要性**：需要一个静止的快照来确认标记阶段已经彻底完成。

::: [!abstract]- 为什么不能完全消除 STW？
虽然 Go 致力于并发 GC，但某些全局状态的切换（如写屏障的开关）必须在所有线程达成共识的情况下进行。
:::

## 性能影响与优化

STW 是导致应用 **卡顿（Jitter）** 和 **延迟（Latency）** 的主要原因。Go 团队通过以下手段持续缩减 STW 时间：

- **并发扫描**：将大部分标记工作移出 STW，与用户代码并发执行。
- **混合写屏障**：消除了 Mark Termination 阶段重扫栈的需求，使 STW 从数百毫秒缩减至亚毫秒级。
- **抢占式调度**：确保 Goroutine 能在极短时间内响应 STW 请求，避免因某个循环任务导致 STW 无法开始。

## 知识扩展

- **Pacing 算法**：Go 运行时根据内存分配速度自动调整 GC 频率，以平衡吞吐量和 STW 影响。
- **安全点 (Safe Point)**：Goroutine 只能在特定的代码位置（如函数调用、循环跳转）响应 STW 停止请求。
- **Gctrace**：通过环境变量 `GODEBUG=gctrace=1` 可以观察每次 GC 的 STW 耗时。
