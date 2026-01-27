---
title: Golang 的 GC 什么时候回出现卡顿
card: true
date: 2026-01-27 10:33:44
tags:
  - interview
  - bytedance
  - golang
---

延长 STW（Stop-The-World）导致的程序“绝对停顿”（如抢占延迟、海量协程栈扫描）以及因资源竞争和 GC 协助（Mark Assist）导致的业务“响应变慢”（吞吐量下降）两大类核心因素。
