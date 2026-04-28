---
title: 背压 (Backpressure)
aliases: f84398b3-48bc-4f2b-b98e-b3bb54cf6b83
date: 2026-03-06 14:17:48
card: true
order:
tags: [wiki]
wiki: [背压, Backpressure]
---

## 定义

**背压 (Backpressure)** 是一种在数据流系统中，下游（消费者）向上游（生产者）反馈处理能力的机制。当消费者无法跟上生产者的速度时，通过背压信号通知生产者减缓发送速率，从而防止系统过载或崩溃。

## 直观理解

想象一个漏斗，如果倒水的速度超过了漏斗流出的速度，水就会溢出。背压就像是漏斗下方的传感器，当水位过高时，告诉倒水的人“慢点倒”，以保持系统的平衡。它解决了“供过于求”导致的资源耗尽（如内存溢出）问题，确保系统在负载高峰时仍能稳定运行。

## 关键点

-   **流量控制**：在异步系统（如 Reactive Streams, Node.js Streams）中至关重要，是防止内存溢出（OOM）的关键手段。
-   **处理策略**：常见的背压策略包括：**缓冲**（Buffering，暂时存储）、**丢弃**（Dropping，丢弃最新或最旧数据）、**控制生产速率**（Throttling，暂停或减速）。

## 参考资料

-   [Reactive Streams Specification](https://www.reactive-streams.org/)
-   [Backpressure explained — the resisted flow of data through software](https://medium.com/@jayphelps/backpressure-explained-the-flow-of-data-through-software-2350b3e77ce7)
