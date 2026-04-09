---
title: Context 的作用与使用场景
aliases: 2cd2c0b4-c94f-4535-9899-4b09bb116bb9
date: 2026-04-09 21:32:38
card: true
order:
tags: [go, interview, context]
---

> **面试官**：请问 Golang 中 Context 的作用是什么？它通常有哪些使用场景？

## 面试回答

“在 Go 语言中，`Context`（上下文）的主要作用是在不同的 Goroutine 之间传递**截止时间（Deadline）**、**取消信号（Cancel Signal）**以及**请求范围的数据（Request-scoped Data）**。

在实际开发中，我们最常使用它的场景有三个：

第一是**超时控制**。比如客户端发起一个 HTTP 请求或者查询数据库，我们可以通过 `context.WithTimeout` 设置一个超时时间。如果底层服务响应太慢，Context 会自动触发取消信号，避免当前 Goroutine 一直阻塞，从而防止系统资源耗尽。

第二是**级联取消**。在微服务架构中，一个请求往往会触发多个子 Goroutine 去并发执行任务。如果最外层的请求被用户取消了，或者某个关键步骤失败了，我们可以通过 `context.WithCancel` 取消父 Context，这个取消信号会沿着 Context 树向下传递，通知所有相关的子 Goroutine 停止工作，释放资源。

第三是**传递上下文数据**。我们可以使用 `context.WithValue` 在整个请求链路中传递像 Trace ID、用户认证 Token 等元数据，方便做链路追踪和日志记录。

总的来说，Context 是 Go 并发编程中管理 Goroutine 生命周期的标准做法，它让复杂的并发控制变得更加规范和简单。”

## 系统讲解

### 核心作用

`context.Context` 是 Go 标准库提供的一个接口，定义了四个核心方法：

- `Deadline()`：返回 Context 被取消的时间（即超时时间）。
- `Done()`：返回一个只读的 channel，当 Context 被取消或超时时，该 channel 会被关闭。
- `Err()`：返回 Context 被取消的原因（如超时或主动取消）。
- `Value(key)`：返回与该 Context 关联的键值对数据。

它的核心设计理念是**树状结构**：通过一个根节点（通常是 `context.Background()`），不断派生出子节点。当父节点被取消时，其所有子节点也会被级联取消。

### 常见使用场景与代码示例

#### 1. 超时控制 (Timeout)

防止 Goroutine 长时间阻塞，保护系统资源。

```go
func fetchAPI(ctx context.Context) error {
    // 模拟耗时操作
    req := make(chan struct{})
    go func() {
        time.Sleep(2 * time.Second)
        close(req)
    }()

    select {
    case <-ctx.Done():
        // 超时或被取消
        return ctx.Err()
    case <-req:
        // 正常完成
        return nil
    }
}

func main() {
    // 设置 1 秒超时
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel() // 必须调用 cancel 释放资源

    err := fetchAPI(ctx)
    fmt.Println("Result:", err) // 输出: Result: context deadline exceeded
}
```

#### 2. 级联取消 (Cancel)

当一个主任务失败或不再需要时，及时终止所有相关的子任务。

```go
func worker(ctx context.Context, name string) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %s stopped\n", name)
            return
        default:
            fmt.Printf("Worker %s working...\n", name)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    go worker(ctx, "A")
    go worker(ctx, "B")
    
    time.Sleep(1 * time.Second)
    cancel() // 主动取消，通知所有 worker 退出
    time.Sleep(100 * time.Millisecond) // 等待 worker 打印退出信息
}
```

#### 3. 传递元数据 (Value)

在请求链路中传递 Trace ID、认证信息等。**注意：不要用 Context 传递业务参数。**

```go
type traceIDKey struct{}

func processRequest(ctx context.Context) {
    // 获取传递的值
    if traceID, ok := ctx.Value(traceIDKey{}).(string); ok {
        fmt.Println("Processing with Trace ID:", traceID)
    }
}

func main() {
    // 注入数据
    ctx := context.WithValue(context.Background(), traceIDKey{}, "req-12345")
    processRequest(ctx)
}
```

### 亮点与深度

#### 底层原理：Done() channel 的懒加载

在 Context 的源码实现中，`Done()` 返回的 channel 是懒加载的（Lazy Initialization）。只有在第一次调用 `Done()` 方法时，才会真正使用 `make(chan struct{})` 去创建这个 channel。这种设计减少了不必要的内存分配，提升了性能。

#### 最佳实践与避坑指南

1. **不要把 Context 放在结构体中**：Context 应该作为函数的第一个参数传递，通常命名为 `ctx`。
2. **不要传递 nil Context**：如果不确定用什么，应该传递 `context.TODO()`，而不是 `nil`。
3. **及时调用 cancel**：使用 `WithCancel`、`WithTimeout`、`WithDeadline` 派生 Context 后，必须在函数退出前调用返回的 `cancel()` 函数，否则会导致 Context 泄漏（内存泄漏）。
4. **Value 的 Key 必须是不可比较类型**：为了避免不同包之间的键冲突，传递 Value 时的 Key 推荐使用自定义的非导出类型（如 `type myKey struct{}`），而不是直接使用内置类型（如 `string`、`int`）。
