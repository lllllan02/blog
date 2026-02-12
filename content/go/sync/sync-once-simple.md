---
title: Go sync.Once 真的简单吗？
aliases: a8b2c3d4-e5f6-4a90-abcd-ef1234567890
date: 2026-02-12 16:30:00
card: false
order: 6
tags:
  - golang
  - sync
  - 译文
---

> 原文：[Go sync.Once is Simple… Does It Really?](https://victoriametrics.com/blog/go-sync-once/)（VictoriaMetrics Blog, 2024-11-01）

## 一句话结论

`sync.Once` 用法简单，但底层实现涉及原子操作与 mutex 的配合，对 panic、错误处理、`done` 置位时机等细节要格外小心。

## sync.Once 是什么

- 保证某函数**只执行一次**，无论被多少 goroutine 同时调用。
- 典型用途：单例初始化（DB 连接池、logger、配置等）。
- 优势：懒加载，延迟到首次使用时执行，减少启动开销；比 `init()` 更适合初始化外部资源。
- 不可重用：`Do()` 执行过一次后，后续调用不会再执行传入的函数，即使用不同函数也不行；标准库没有提供 reset 方法。

```go
var once sync.Once
var conf Config

func GetConfig() Config {
	once.Do(func() { conf = fetchConfig() })
	return conf
}
```

若 `GetConfig()` 被多次调用，`fetchConfig()` 只会执行一次。

```go
var once sync.Once
func main() {
	once.Do(func() { fmt.Println("This will be printed once") })
	once.Do(func() { fmt.Println("This will not be printed") })
}
// Output: This will be printed once
```

### panic 与错误处理

- **panic**：若 `Do(f)` 中 `f` 发生 panic，`sync.Once` 仍视为“已完成”，后续 `Do()` 不会再执行，也无法重试。
- **错误**：需用包级变量保存，否则只有第一次调用能拿到错误；后续调用会返回零值且拿不到错误：

```go
var once sync.Once
var config Config
var err error  // 必须包级，否则后续调用拿不到错误

func GetConfig() (Config, error) {
	once.Do(func() { config, err = fetchConfig() })
	return config, err
}
```

### Go 1.21+：OnceFunc、OnceValue、OnceValues

- `OnceFunc(f)`：包装 `f`，返回的新函数只执行一次 `f`；若 `f` panic，后续调用也会 panic。
- `OnceValue[T](f)`：缓存 `f()` 的返回值，后续调用直接返回缓存；无需闭包。
- `OnceValues[T, K](f)`：支持多返回值（含 error），错误也会被缓存；若需重试，需新建实例。

## 底层实现

### 结构体

```go
type Once struct {
	done atomic.Uint32
	m    Mutex
}
```

- `done` 放在结构体首位：在 x86-64 等架构上，访问结构体首字段更快（基地址直接加载）；同时利于内联优化。

### 实现演进

1. **初版（仅 mutex，Rob Pike 2010）**：每次 `Do()` 都加锁，性能差。
2. **快路径**：先判断 `done == 1`，已执行则直接返回，避免锁竞争。
3. **慢路径**：加锁后再次检查 `done`（因检查与加锁之间存在竞态窗口），用 `defer` 在 `f()` 执行完（或 panic）后再设置 `done = 1`。
4. **内联优化**：将慢路径抽到 `doSlow(f)`，使 `Do()` 足够简单，可被编译器内联；首次调用后，绝大多数是快路径，只需一次原子 Load。

### 为什么不能先置 done 再执行 f()

若先置 `done = 1` 再执行 `f()`，会出现：`f()` 还在执行（如网络调用），其他 goroutine 已看到 `done == 1`，误以为资源就绪，导致 nil 解引用或 panic。

![[sync-once-done-mistake.webp]]

正确做法：用 `defer` 在 `f()` 返回后再置 `done`：

```go
if o.done.Load() == 0 {
	defer o.done.Store(1)
	f()
}
```

### CAS 为何不可行

用 `CompareAndSwap(0, 1)` 的写法看似更简洁：胜出 goroutine 执行 `f()`，其余返回。但存在同样问题：胜出 goroutine 尚未执行完 `f()`，其他 goroutine 就已通过 `done` 判断“已完成”，从而误用未就绪的资源。

![[sync-once-cas.webp]]

## 术语表

| 英文 | 中文 |
|------|------|
| fast path | 快路径 |
| slow path | 慢路径 |
| lazy loading | 懒加载 |
| CAS (Compare-And-Swap) | 比较并交换 |
