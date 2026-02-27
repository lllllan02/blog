---
title: 幂等性 (Idempotency)
wiki: ["幂等性", "Idempotency"]
aliases: [2A1ACD41-22CA-421F-AE30-ED83BC99521C]
date: 2026-02-27 16:50:00
card: true
tags:
  - wiki
  - distributed-system
---

## 定义

> **幂等性（Idempotency）** 是指一个操作无论执行多少次，其结果（对系统状态的影响）都与执行一次是相同的。

就像数学中的绝对值函数 `f(x) = |x|`，`f(f(x)) = f(x)`。在计算机系统中，它保证了重复调用（如网络重试）不会产生副作用，是构建可靠分布式系统的基石。

- **HTTP 方法**: `GET`, `PUT`, `DELETE` 是幂等的；`POST` 不是。
- **应用场景**: 防止重复扣款、表单重复提交、消息队列重复消费。

## 参考

- [MDN Web Docs: Idempotent](https://developer.mozilla.org/zh-CN/docs/Glossary/Idempotent)
