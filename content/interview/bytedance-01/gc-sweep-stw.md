---
title: 清理过程会出现 STW 吗？
card: true
date: 2026-01-27 10:33:44
order: 3
tags:
  - golang
  - gc
---

Sweeping 清理过程本事是并发运行的，不会出现 STW(Stop The World)。

但在 GC 的完整周期中，Sweep Termination（清理终止）阶段中有一项操作是清扫上一轮 GC 的剩余任务。这个阶段也包好了清理动作，而这个阶段是 STW 的。
