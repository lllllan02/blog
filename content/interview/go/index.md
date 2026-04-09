---
title: Golang 面试题库
aliases: 0ef1f46b-c498-4adb-9e8a-f78bb863a344
date: 2026-04-09 16:30:50
card: false
tags:
  - interview
  - golang
---

# Golang 面试题库

这里记录了 Golang 相关的核心面试题，请逐一攻克：

## 基础语法与数据结构
- [ ] 数组 (Array) 和 切片 (Slice) 的区别是什么？
- [ ] Slice 的底层结构是怎样的？它的扩容机制是怎样的？
- [ ] Map 的底层实现原理是什么？它是并发安全的吗？如何实现并发安全的 Map？
- [ ] Channel 的底层实现原理？有缓冲和无缓冲 Channel 的区别？
- [ ] Channel 会在什么情况下引发 panic？
- [ ] `make` 和 `new` 的区别是什么？
- [ ] `defer` 的执行顺序是怎样的？`defer` 和 `return` 的执行顺序？
- [ ] `interface` 的底层结构是什么（`iface` 和 `eface`）？
- [ ] 什么是空结构体 `struct{}`？它有什么应用场景？
- [ ] `rune` 类型是什么？它和 `byte` 有什么区别？

## 并发编程
- [ ] 什么是 Goroutine？它和线程的区别是什么？
- [ ] 详细讲讲 Golang 的 GMP 调度模型？
- [ ] GMP 模型中，如果一个 Goroutine 发生阻塞（如系统调用），会发生什么？
- [ ] 什么是工作窃取（Work Stealing）机制？
- [ ] `Context` 的作用是什么？有哪些使用场景？
- [ ] `sync.WaitGroup` 的底层原理？
- [ ] `sync.Mutex` 的底层实现？正常模式和饥饿模式有什么区别？
- [ ] 什么是 `sync.Pool`？它的底层原理和使用场景？

## 内存管理与底层原理
- [ ] 什么是逃逸分析？什么情况下会发生内存逃逸？
- [ ] Golang 的垃圾回收（GC）机制是怎样的？详细说说三色标记法。
- [ ] 什么是混合写屏障（Hybrid Write Barrier）机制？
- [ ] GC 的触发时机有哪些？
- [ ] Golang 中的内存分配机制是怎样的（TCMalloc）？
- [ ] 什么是反射（Reflection）？反射的性能问题及应用场景？
- [ ] Go 语言中的函数参数传递是值传递还是引用传递？
