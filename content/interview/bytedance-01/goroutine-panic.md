---
title: Goroutine 中出现 panic 会发生什么
aliases:
  - 4e2b1a3d-5f6c-4b8a-9d0e-1f2a3b4c5d6e
card: true
date: 2026-01-27 10:33:44
order: 1
tags:
  - interview
  - golang
  - goroutine
  - panic
---

## 核心解答

在 Go 语言中，如果一个 Goroutine 发生了 `panic` 且没有被 `recover` 捕获，**会导致整个进程崩溃退出**。

这是因为 Go 的设计哲学倾向于[[69485FF5-18DF-4AA6-B3C1-3BBC65483869|“快速失败”（Fail-Fast）]]。即使 `panic` 发生在子 Goroutine 中，它也会向上传播到该 Goroutine 的顶层，触发运行时的崩溃处理逻辑，打印堆栈信息并终止程序。

## 解答思路

1.  **进程模型**：理解 Go 程序是一个单进程多线程（通过调度器映射到 M）的模型。
2.  **Panic 传播机制**：`panic` 是绑定在特定的 Goroutine 上的。当 `panic` 发生时，它会沿着当前 Goroutine 的调用栈向上寻找 `recover`。
3.  **运行时行为**：如果到达 Goroutine 顶层仍未被捕获，`runtime.dieFromPanic` 会被调用，从而导致整个进程退出。

## 深度解析与面试技巧

::: [!abstract]- 如何正确捕获子 Goroutine 的 panic？
`recover` 必须在发生 `panic` 的**同一个 Goroutine** 中被调用。
```go
go func() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("Recovered in goroutine: %v\n", r)
        }
    }()
    // 可能会发生 panic 的逻辑
    panic("oops")
}()
```
:::

::: [!tip]- 面试技巧：防御性编程与资源安全
在并发编程中，如果子 Goroutine 发生了 `panic` 且被 `recover` 捕获，函数会立即停止执行后续代码。如果资源释放逻辑（如 `Close()`、`Unlock()` 或 `wg.Done()`）未放在 `defer` 中，将被跳过导致**资源泄漏**或**死锁**。

在面试中提到 `panic` 时，应主动关联到以下资源管理原则：
1. **尽早 defer**：在成功获取资源后，立即注册 `defer` 释放操作，确保逻辑健壮性。
2. **顺序敏感**：利用 `defer` 的后进先出（LIFO）特性，确保依赖关系正确的释放顺序。
3. **防御性编程**：养成使用 `defer` 释放资源的习惯是区分初级和中高级开发者的重要标志。
:::