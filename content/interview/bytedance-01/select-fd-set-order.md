---
title: 为什么 select 的文件描述符集合是有序的？
card: true
date: 2026-01-27 10:33:44
order: 8
tags:
  - interview
  - bytedance
  - os
---

`select` 使用的是 `fd_set`（位图）。它并不是“有序集合”，而是位图的索引对应 FD 的数值。内核 en 处理时，会从 0 遍历到 maxfd。所谓的“有序”是指内核遍历位图的过程是线性的。
