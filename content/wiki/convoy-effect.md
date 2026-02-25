---
title: 护航效应 (Convoy Effect)
wiki: ["护航效应", "Convoy Effect"]
aliases: [4157DBF9-70F6-41A4-8C69-D47B813E1D94]
date: 2026-02-25 10:15:00
card: true
tags:
  - wiki
  - operating-system
  - scheduling
---

## 定义

> **护航效应 (Convoy Effect)** 是指在非抢占式调度（如 FCFS）中，因一个长 CPU 密集型进程长时间占用 CPU，导致后续众多短 I/O 密集型进程被迫等待的现象。

就像在单车道高速公路上，一辆速度缓慢的大卡车（长进程）挡在前面，导致后面的一串跑车（短进程）无法超车，只能被迫慢速行驶。这会导致 CPU 和 I/O 设备的利用率都大幅降低。

- **发生场景**: 先来先服务 (FCFS) 等非抢占式调度算法。
- **后果**: I/O 密集型进程响应变慢，I/O 设备闲置，系统整体吞吐量下降。
- **解决**: 采用抢占式调度（如轮转调度 Round Robin），强制大进程定期交出 CPU。

## 参考

- [Convoy Effect in Operating Systems - GeeksforGeeks](https://www.geeksforgeeks.org/convoy-effect-operating-systems/)
