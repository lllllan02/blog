---
title: Go
aliases: 3d8e9c2a-7b1a-4f5d-9e2c-8b1a2f3d4e5f
date: 2026-02-08 11:00:00
order: 2
tags:
  - golang
  - source-reading
  - go1.21
---

> 本计划旨在提供一个从基础到核心、从标准库到运行时的全方位阅读路径。建议基于 [Go 1.21+](https://github.com/golang/go/tree/release-branch.go1.21/src) 版本。

## 阶段一：基础数据结构 (Basic Data Structures)
理解 Go 语言最基础的构建块，关注内存布局与扩容机制。
- [ ] [[8d2e1c3a-9b4d-4f6d-a1c2-7b3a4f5d6e7f|src/runtime/slice.go: Slice (切片)]]
- [ ] `src/runtime/string.go`: String (字符串)
- [ ] `src/runtime/map.go`: Map (哈希表)
- [ ] `src/runtime/iface.go` & `eface.go`: Interface (接口底层实现)

## 阶段二：并发原语 (Concurrency Primitives)
深入理解 Go 的灵魂，包括内置的 `chan` 和 `sync` 包。
- [ ] `src/sync/atomic/`: Atomic (原子操作)
- [ ] `src/runtime/chan.go`: Channel (通道)
- [ ] `src/sync/mutex.go`: Mutex & RWMutex (互斥锁与读写锁)
- [ ] `src/sync/waitgroup.go`: WaitGroup
- [ ] `src/sync/once.go`: Once
- [ ] `src/sync/cond.go`: Cond (条件变量)
- [ ] `src/sync/pool.go`: Pool (对象池)
- [ ] `src/sync/map.go`: sync.Map (线程安全 Map)

## 阶段三：运行时 Runtime (The Core)
这是最硬核的部分，决定了 Go 的性能与行为。
- [ ] **调度器 (Scheduler)**: `src/runtime/proc.go` (GMP 模型、sysmon)
- [ ] **栈管理 (Stack Management)**: `src/runtime/stack.go` (连续栈、栈扩容)
- [ ] **内存分配 (Memory Allocation)**: `src/runtime/malloc.go`, `mheap.go`, `mcentral.go`, `mcache.go`
- [ ] **垃圾回收 (GC)**: `src/runtime/mgc.go` (三色标记、STW、辅助标记)
- [ ] **定时器 (Timer)**: `src/runtime/time.go` (四叉堆实现与优化)

## 阶段四：标准库与工程实践 (Standard Library)
学习官方如何利用上述原语构建高性能组件。
- [ ] **Context**: `src/context/context.go` (上下文控制)
- [ ] **Net/HTTP**: `src/net/http/` (Server 实现、Transport 连接池)
- [ ] **IO**: `src/io/io.go` & `src/bufio/bufio.go` (接口抽象与缓冲)
- [ ] **Reflect**: `src/reflect/` (反射的实现原理与性能开销)
- [ ] **Errors**: `src/errors/` (1.13+ 的 error wrapping)

## 阶段五：工具链与底层 (Toolchain & Low Level)
- [ ] **CGO**: `src/runtime/cgocall.go`
- [ ] **System Calls**: `src/syscall/`
- [ ] **Compiler/Linker**: (可选) `src/cmd/compile/`
