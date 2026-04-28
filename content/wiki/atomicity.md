---
title: 原子性 (Atomicity)
wiki: ["原子性", "Atomic"]
aliases: 5f2e8d1a-9c4b-4a7d-8e3f-1b6c9d2e5a8f
date: 2026-02-26 10:00:00
card: true
order:
tags:
  - wiki
  - concurrency
  - database
---

## 定义

**原子性 (Atomicity)** 是指一个操作是不可分割的整体，要么全部执行成功，要么全部不执行，不会出现部分执行的中间状态。

## 直观理解

就像银行转账，钱从 A 账户扣除并增加到 B 账户必须是一个原子操作。如果扣款成功但入账失败，系统必须回滚到转账前的状态，仿佛什么都没发生过。

## 关键点

-   **并发编程**：原子操作不会被线程调度机制打断，其他线程无法看到操作的中间状态。
-   **数据库事务**：它是 ACID 特性之一（All or Nothing），保证数据的一致性。

## 参考资料

- [Wikipedia - Atomicity (database systems)](https://en.wikipedia.org/wiki/Atomicity_(database_systems))
