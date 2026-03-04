---
title: 5. Go 协程的调度怎么实现，GMP 模型
date: 2026-03-04 16:04:32
tags: [interview, go, concurrency]
aliases: [F02BEC8A-FC13-4B47-B0A9-948B9FF06F46]
card: true
order: 5
---

## 问题分析

面试官考察的是对 Go 语言并发模型核心机制的理解。Go 语言之所以能够轻松支持百万级并发，很大程度上归功于其高效的调度器（Scheduler）和 GMP 模型。你需要清晰地解释 G、M、P 分别代表什么，它们之间的关系，以及调度器是如何通过 Work Stealing（工作窃取）和 Hand Off（移交）机制来平衡负载、减少线程切换开销的。

## 核心解答

### 口语回答

“Go 语言的调度器采用了 GMP 模型。其中 **G** 代表 Goroutine，也就是协程，它包含了栈、指令指针等信息；**M** 代表 Machine，是内核线程，负责执行 G；**P** 代表 Processor，是处理器，它维护了一个本地队列，存放待执行的 G，并提供了 M 执行 G 所需的上下文资源。

调度的核心思想是**复用线程**。P 的数量由 `GOMAXPROCS` 决定，通常等于 CPU 核数。M 必须绑定 P 才能执行 G。当一个 M 阻塞（比如系统调用）时，P 会与 M 分离（Hand Off），去寻找空闲的 M 或创建新 M 继续执行队列中的 G，从而避免线程阻塞导致整个 P 闲置。

调度策略上，Go 采用了**Work Stealing**机制：当 P 的本地队列为空时，它会尝试从全局队列或其他 P 的本地队列‘偷’一半 G 来执行，实现了负载均衡。此外，Go 1.14 引入了基于信号的**抢占式调度**，解决了长循环导致其他 G 饿死的问题。”

### 核心结论

1.  **GMP 模型**：
    *   **G (Goroutine)**: 协程，用户级轻量级线程。
    *   **M (Machine)**: 内核线程，执行计算的实体。
    *   **P (Processor)**: 处理器，管理 G 队列，解耦 G 和 M。
2.  **调度策略**：
    *   **复用线程**：避免频繁创建/销毁线程（Work Stealing, Hand Off）。
    *   **利用并行**：`GOMAXPROCS` 设置 P 的数量，利用多核 CPU。
    *   **抢占**：基于信号的抢占，防止长任务饿死其他 G。
    *   **全局队列**：平衡负载，防止 G 饥饿。

## 详细解析

### GMP 模型详解

Go 调度器的核心是 GMP 模型，它将 Goroutine (G) 映射到内核线程 (M) 上执行，中间引入了 Processor (P) 作为中间层。

*   **G (Goroutine)**：
    *   Go 语言中的协程，轻量级线程。
    *   包含栈、指令指针 (IP)、调度信息等。
    *   状态：`_Gwaiting`（等待中）、`_Grunnable`（可运行）、`_Grunning`（运行中）、`_Gsyscall`（系统调用中）、`_Gdead`（已死亡）。
*   **M (Machine)**：
    *   操作系统内核线程。
    *   负责执行 G 的代码。
    *   M 需要绑定 P 才能执行 G（除非在执行系统调用或 GC 辅助工作）。
    *   M 的数量可以远大于 P，但同时执行 Go 代码的 M 数量最多只有 `GOMAXPROCS` 个。
*   **P (Processor)**：
    *   逻辑处理器，代表执行 G 所需的上下文资源（Context）。
    *   维护了一个**本地运行队列 (Local Run Queue)**，存放待执行的 G。
    *   P 的数量由 `GOMAXPROCS` 环境变量决定，默认为 CPU 核数。
    *   P 的引入解耦了 G 和 M，使得 M 可以复用，并且实现了 Work Stealing。

### 调度器设计策略

Go 调度器旨在解决传统多线程模型的缺陷（高内存占用、高上下文切换开销），其核心策略包括：

1.  **复用线程 (Reuse Threads)**：
    *   **Work Stealing (工作窃取)**：当 P 的本地队列为空时，它会尝试从全局队列获取 G，如果全局队列也为空，它会随机选择另一个 P，并从其本地队列中“偷”走一半的 G。这保证了所有 P 都有活干，避免了负载不均。
    *   **Hand Off (移交)**：当 M 执行的 G 进行系统调用（Syscall）阻塞时，M 会释放 P。P 会寻找另一个空闲的 M（或创建新 M）来继续执行本地队列中的其他 G。旧的 M 在系统调用返回后，会尝试获取 P，如果获取不到，则将 G 放入全局队列，自己进入休眠。

2.  **利用并行 (Utilize Parallelism)**：
    *   通过设置 `GOMAXPROCS`，Go 程序可以同时在多个 CPU 核上运行，充分利用多核优势。

3.  **抢占 (Preemption)**：
    *   **协作式抢占 (旧版)**：依赖 G 主动让出 CPU（如函数调用时检查栈）。如果 G 执行死循环且无函数调用，会导致其他 G 饿死。
    *   **基于信号的抢占 (Go 1.14+)**：sysmon 线程会向运行时间过长的 M 发送信号（SIGURG），M 收到信号后会中断当前 G 的执行，保存上下文，将其放入全局队列，并调度下一个 G。

4.  **全局队列 (Global Queue)**：
    *   除了 P 的本地队列，还有一个全局运行队列。
    *   当 P 的本地队列满时，新创建的 G 会被放入全局队列。
    *   为了防止全局队列中的 G 饿死，P 在调度循环中会以一定的概率（每 61 次调度）优先检查全局队列。

### 调度过程

调度器 `schedule()` 函数的大致逻辑如下：

1.  **检查全局队列**：为了保证公平性，每经过 61 次调度，优先从全局队列获取 G。
2.  **检查本地队列**：从当前 P 的本地队列获取 G。
3.  **Work Stealing**：如果本地队列为空，尝试从其他 P 的本地队列窃取 G。
4.  **检查网络轮询器 (Netpoller)**：如果还是没有 G，检查网络轮询器是否有就绪的 G（非阻塞 I/O）。
5.  **执行 G**：找到 G 后，M 开始执行 G。
6.  **G 结束/阻塞**：G 执行完毕或阻塞后，M 再次进入调度循环。

### 特殊场景

#### 系统调用 (Syscall)

*   **Raw Syscall (如 CGO)**：M 和 G 都会阻塞。P 会与 M 分离（Hand Off），寻找其他 M 执行 P 队列中的 G。
*   **Netpoller (网络 I/O)**：Go 对网络 I/O 进行了封装。当 G 进行网络读写时，会被放入 Netpoller 中等待，M 不会阻塞，而是继续执行其他 G。当网络数据就绪后，G 会被移回 P 的本地队列或全局队列。

#### 阻塞 (Channel/Mutex)

当 G 因为 Channel 操作或 Mutex 锁阻塞时，G 会被挂起（状态变为 `_Gwaiting`），并从 P 的运行队列中移除。M 会继续执行队列中的下一个 G。当条件满足（如 Channel 可读/写，锁释放）时，G 会被唤醒并重新放入 P 的队列。

## 扩展知识

### 1. 为什么要有 P？

在 Go 1.0 时代，只有 G 和 M，调度器维护一个全局的 G 队列。所有 M 都从全局队列获取 G，这导致了严重的锁竞争（Global Lock Contention）。P 的引入主要就是为了解决这个问题：
*   **本地队列**：每个 P 都有自己的本地队列，M 获取 G 时大多只需要访问本地队列，无需加全局锁，大大减少了锁竞争。
*   **数据局部性**：G 在同一个 P 上执行，利用了 CPU 缓存。

### 2. GOMAXPROCS 的默认值

在 Go 1.5 之前，`GOMAXPROCS` 默认值为 1。从 Go 1.5 开始，默认值为 CPU 的核数。这意味着 Go 程序默认就是并行的。

### 3. 调度器的可视化

可以使用 `go tool trace` 工具来可视化查看调度器的行为，分析 G 的创建、阻塞、调度延迟等信息，是排查性能问题的利器。

## 推荐阅读

*   **[Scalable Go Scheduler Design Doc](https://docs.google.com/document/d/1TTj4T2JO42uD5ID9e89oa0sLKhJYD0Y_kqxDv3I3XMw/edit)**: Dmitry Vyukov 撰写的调度器设计文档，是理解 GMP 模型起源和设计决策的权威资料。
*   **[Go 语言设计与实现 - 调度器](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-goroutine/)**: Draveness 的深度解析文章，图文并茂，非常适合中文读者。
*   **[Scheduling In Go : Part I - OS Scheduler](https://www.ardanlabs.com/blog/2018/08/scheduling-in-go-part1.html)**: Ardan Labs 的 William Kennedy 撰写的系列文章（共三篇），深入浅出地讲解了 OS 调度器和 Go 调度器。
*   **[The Go scheduler](https://morsmachine.dk/go-scheduler)**: Daniel Morsing 的经典文章，虽然较早，但对基础概念的解释非常清晰。
