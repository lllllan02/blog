---
title: The Go Blog
aliases: 39460182-683f-49a5-a917-17a000066b2d
date: 2026-02-13 20:21:00
card: false
order: 1
tags:
---

> [The Go Blog](https://go.dev/blog/all)

## 2023 年

### 2023.09

[[aa566a91-6ca9-4309-b8de-039cd1289ddb|Go 1.22 修复 For 循环]]

## 2022 年

### 2022.03

[[57ecac26-b686-482d-a18e-af5efb5bfa84|Go 1.18 发布了！]]

## 2021 年

### 2021.07

[[3cc06a58-99a3-498c-8744-30365fa323ed|为什么需要泛型？]]

## 2010 年

### 2010.03

[[80e78d18-bc80-44cd-9e49-d5e1c14c9ff7|Go: 2010 年 3 月最新资讯]]

## TODO

这是按时间线（从旧到新）整理的 Go 官方博客重要更新列表，重点涵盖了**泛型**、**性能优化**、**迭代器**和**标准库**的关键演进：

### 2022 年：泛型元年
*   **2022-03-15** - [Go 1.18 is released!](https://go.dev/blog/go1.18)
    *   **重要性**：Go 历史上最大的语言变更，正式引入**泛型**（Generics），同时引入了 Fuzzing 测试工具和 Workspaces 工作区模式。
*   **2022-03-22** - [An Introduction To Generics](https://go.dev/blog/intro-generics)
    *   **重要性**：官方对泛型的权威介绍，解释了基本语法和使用场景。

### 2023 年：工程化完善 (PGO, Slog, Loop Fix)
*   **2023-08-08** - [Go 1.21 is released!](https://go.dev/blog/go1.21)
    *   **重要性**：引入 **PGO (Profile Guided Optimization)** 编译优化；增加内置函数 `min`, `max`, `clear`；正式支持 WASI。
*   **2023-08-22** - [Structured Logging with slog](https://go.dev/blog/slog)
    *   **重要性**：标准库终于有了结构化日志包 `log/slog`，这是现代 Go 应用开发的必备工具。
*   **2023-09-19** - [Fixing For Loops in Go 1.22](https://go.dev/blog/loopvar-preview)
    *   **重要性**：预告修复了困扰 Go 开发者十年的 `for` 循环变量共享问题（不再需要 `v := v`）。

### 2024 年：迭代器与路由增强
*   **2024-02-06** - [Go 1.22 is released!](https://go.dev/blog/go1.22)
    *   **重要性**：正式落地 `for` 循环变量修复；`net/http` 路由增强（支持方法匹配和通配符）。
*   **2024-02-13** - [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements)
    *   **重要性**：详细介绍了标准库 HTTP 路由的新能力，减少了对第三方路由库（如 Gin/Chi）的依赖需求。
*   **2024-08-13** - [Go 1.23 is released](https://go.dev/blog/go1.23)
    *   **重要性**：引入 **Range Over Function Types**（迭代器），这是 Go 处理序列数据的重大范式转变。
*   **2024-08-20** - [Range Over Function Types](https://go.dev/blog/range-functions)
    *   **重要性**：深入讲解如何使用 `iter` 包和 `range` 遍历自定义函数，是理解 Go 迭代器的必读文章。

### 2025 年：性能与底层革新 (Swiss Map, Green Tea GC)
*   **2025-02-11** - [Go 1.24 is released!](https://go.dev/blog/go1.24)
    *   **重要性**：Map 实现升级为 **Swiss Tables**，大幅提升性能；支持泛型类型别名（Generic Type Aliases）。
*   **2025-02-26** - [Faster Go maps with Swiss Tables](https://go.dev/blog/swiss-maps)
    *   **重要性**：技术深度文，详细解释了新 Map 底层原理及其带来的性能红利。
*   **2025-08-12** - [Go 1.25 is released](https://go.dev/blog/go1.25)
    *   **重要性**：引入容器感知的 `GOMAXPROCS`（对 K8s 部署非常重要）；新增 Flight Recorder 诊断工具。
*   **2025-10-29** - [The Green Tea Garbage Collector](https://go.dev/blog/green-tea)
    *   **重要性**：介绍 Go 1.25 中实验性的新垃圾回收器 "Green Tea"，旨在进一步降低延迟。

### 2026 年：最新进展
*   **2026-02-10** - [Go 1.26 is released](https://go.dev/blog/go1.26)
    *   **重要性**：当前的最新稳定版本，包含新 GC 的正式落地和 CGO 开销的进一步降低。