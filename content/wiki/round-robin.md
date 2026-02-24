---
title: 时间片轮转调度 (Round Robin)
wiki: ["时间片轮转调度", "RR"]
aliases: 3d1c60d8-a05e-4632-bcb0-4d7fa8d59ff0
date: 2026-02-24 15:30:00
card: true
tags:
  - wiki
  - os
---

## 定义

> **时间片轮转调度 (Round Robin, RR) 是一种最古老、最简单、最公平且使用最广的算法，它按固定的时间段（称为时间片）循环地为每个进程分配 CPU。**

## 核心直觉

RR 的核心是**公平性**和**响应性**。它就像是老师给每个学生轮流分配相同的时间来回答问题：每个学生（进程）都有机会发言，即使一个学生有很多话要说，时间一到也必须停下来，让下一个学生发言。这种机制确保了没有任何进程会因为其他长进程的运行而长时间等待（饥饿）。

- **时间片 (Time Quantum)**: 算法的关键参数。如果太长，退化为先来先服务 (FCFS)；如果太短，频繁的上下文切换会带来巨大的开销。

## 参考

- [Round-robin scheduling - Wikipedia](https://en.wikipedia.org/wiki/Round-robin_scheduling)
