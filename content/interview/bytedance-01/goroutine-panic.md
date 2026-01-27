---
title: Goroutine 中出现 panic 会发生什么
card: true
date: 2026-01-27 10:33:44
order: 1
tags:
  - interview
  - bytedance
  - golang
---

如果任何一个子 Goroutine 发生了 panic，且该 Goroutine 内部没有使用 `defer` + `recover` 来拦截它，那么整个程序（包括主 Goroutine 和其他所有正在运行的 Goroutine）都会立即终止。
