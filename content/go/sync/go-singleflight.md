---
title: Go Singleflight：在代码里合并请求，而不是压垮数据库
aliases: 2fc8b9c4-dca3-4d37-8e4f-5ad8fdcc9904
date: 2026-02-12 18:00:00
card: false
order: 7
tags:
  - golang
  - sync
  - 译文
---

> 原文：[Go Singleflight Melts in Your Code, Not in Your DB](https://victoriametrics.com/blog/go-singleflight/)（VictoriaMetrics Blog）

## 一句话结论

`singleflight` 能合并多个对同一数据的并发请求，只让其中第一个真正执行，其余等待并复用结果，从而减轻数据库压力，避免缓存击穿（cache stampede）。

## 问题背景

当多个请求同时请求**同一数据**时，默认行为是每个请求各自去查数据库，导致同一查询被执行多次，既低效又给数据库带来不必要的负载。

singleflight 的思路：**只有第一个请求真正执行**，其余等待；第一个完成后，所有等待者拿到同一结果，不再重复执行。

## Singleflight 是什么

- 包位置：`golang.org/x/sync/singleflight`，非标准库，由 Go 团队维护。
- 核心：对同一 key 同一时刻只允许一个“在途”（in-flight）操作；若其他 goroutine 用相同 key 请求，会等待而非重复执行。

## 基本用法示例

5 个 goroutine 几乎同时请求同一数据，每隔约 40ms 启动一个；用 `singleflight.Group` 后，只有第一个会执行 `fetchData()`，其余复用结果：

```go
var callCount atomic.Int32
var wg sync.WaitGroup

func fetchData() (interface{}, error) {
	callCount.Add(1)
	time.Sleep(100 * time.Millisecond)
	return rand.Intn(100), nil
}

func fetchDataWrapper(g *singleflight.Group, id int) error {
	defer wg.Done()
	time.Sleep(time.Duration(id) * 40 * time.Millisecond)
	v, err, shared := g.Do("key-fetch-data", fetchData)
	if err != nil {
		return err
	}
	fmt.Printf("Goroutine %d: result: %v, shared: %v\n", id, v, shared)
	return nil
}

func main() {
	var g singleflight.Group
	const numGoroutines = 5
	wg.Add(numGoroutines)
	for i := 0; i < numGoroutines; i++ {
		go fetchDataWrapper(&g, i)
	}
	wg.Wait()
	fmt.Printf("Function was called %d times\n", callCount.Load())
}
// Output:
// Goroutine 0: result: 90, shared: true
// Goroutine 2: result: 90, shared: true
// Goroutine 1: result: 90, shared: true
// Goroutine 3: result: 13, shared: true
// Goroutine 4: result: 13, shared: true
// Function was called 2 times
```

5 个 goroutine 请求，`fetchData` 只被调用 2 次（批次 0、1、2 合并为一次；批次 3、4 合并为另一次）。

### shared 的含义

`shared` 表示**该结果是否被多个调用者共享**，而不是“是否为等待者”。因此第一个执行者也可能是 `shared == true`：只要最终有多个 goroutine 复用了同一结果，就为 true。

## 有缓存时还需要 singleflight 吗？

缓存和 singleflight 解决不同问题，可以配合使用：

- **缓存**：减少重复查库，提升命中时的响应速度。
- **singleflight**：在缓存 miss 时，防止大量请求同时穿透到 DB（缓存击穿 / cache stampede）。

若缓存失效后，10,000 个请求同时 miss，会触发 10,000 次相同查询；singleflight 可保证只有 1 次真正打到数据库。

::: [!tip]- 多核场景下的用法
singleflight 内部用**全局锁**保护 key 映射，高并发下可能成为热点。更推荐的做法是：**仅在 cache miss 时**使用 singleflight，而不是对所有请求都包一层。多核场景还可考虑 [shardedsingleflight](https://github.com/tarndt/shardedsingleflight) 做分片。
:::

## 主要 API

| 方法 | 行为 |
|------|------|
| `group.Do(key, fn)` | 阻塞式；相同 key 合并为一次执行，其余等待并复用结果。 |
| `group.DoChan(key, fn)` | 返回 `<-chan Result`，适合异步或配合 `select` 做超时/取消。 |
| `group.Forget(key)` | 移除 key，下次 `Do` 会重新执行（用于过期/失效场景）。 |

`Result` 含 `Val`、`Err`、`Shared`。

### DoChan 与超时

`DoChan` 适合需要超时或取消的场景：

```go
func fetchDataWrapperWithTimeout(g *singleflight.Group, id int) error {
	defer wg.Done()
	ch := g.DoChan("key-fetch-data", fetchData)
	select {
	case res := <-ch:
		if res.Err != nil {
			return res.Err
		}
		fmt.Printf("Goroutine %d: result: %v, shared: %v\n", id, res.Val, res.Shared)
	case <-time.After(50 * time.Millisecond):
		return fmt.Errorf("timeout waiting for result")
	}
	return nil
}
```

注意：超时后，后续新请求仍会等待第一个执行完成；若数据易变，可配合 `Forget` 丢弃旧执行、触发新执行。

### Forget 的用法

`Forget(key)` 会从内部 map 中移除该 key，下次 `Do` 会当作全新请求重新执行：

```go
func fetchDataWrapperWithForget(g *singleflight.Group, id int, forget bool) error {
	defer wg.Done()
	if forget {
		g.Forget("key-fetch-data")
	}
	v, err, shared := g.Do("key-fetch-data", fetchData)
	// ...
}

// main 中：goroutine 0、1 正常调用；goroutine 2 先 Forget 再 Do
go fetchDataWrapperWithForget(&g, 0, false)
go fetchDataWrapperWithForget(&g, 1, false)
time.Sleep(10 * time.Millisecond)
go fetchDataWrapperWithForget(&g, 2, true)  // 触发新执行
// Output: Function was called 2 times
```

goroutine 0 和 1 共享一次执行；goroutine 2 因 `Forget` 触发第二次执行。

## 边界情况与注意点

- **首请求阻塞**：第一个 goroutine 卡住时，所有等待者一同卡住；可用 `DoChan` + `select` 做超时。
- **错误与 panic**：若执行函数 panic 或返回错误，所有等待者都会得到相同错误或 panic；使用 `DoChan` 时，会通过 unrecoverable panic 导致程序崩溃。
- **Forget 时机**：数据易变时，可用 `Forget` 丢弃正在执行的结果，触发新的执行。

## 底层原理

### 结构体

```go
type Group struct {
	mu sync.Mutex
	m  map[string]*call  // key -> call，懒初始化
}

type call struct {
	wg    sync.WaitGroup
	val   interface{}
	err   error
	dups  int
	chans []chan<- Result
}
```

- `Group.mu`：保护整个 key map，不是按 key 加锁。
- `call.wg`：等待首个 goroutine 完成；完成后通知所有等待者。

### Do 流程

1. 加锁，检查 key 是否已有 call。
2. **若已有**：`dups++`，解锁，`call.wg.Wait()` 等待，返回已有结果。
3. **若没有**：创建 `call`，`wg.Add(1)`，加入 map，解锁，执行 `fn()`；完成后在 defer 中 `wg.Done()`、从 map 删除、分发结果给等待者。

### panic 与 runtime.Goexit 处理

- **panic**：被捕获并包装为 `panicError`，清理后重新抛出；所有等待者都会收到该 panic。
- **runtime.Goexit**：通过 defer 中 `normalReturn` 未被置位来检测，做相应清理；仅当前 goroutine 退出，不影响其他 goroutine。
- **DoChan 且 panic**：无法在等待 goroutine 中 panic，singleflight 会发起 unrecoverable panic，导致程序崩溃。

## 术语表

| 英文 | 中文 |
|------|------|
| singleflight | 单飞（合并相同请求） |
| in-flight | 在途、正在进行 |
| cache stampede | 缓存击穿 / 缓存惊群 |
| shared | 共享的（结果被多个调用者复用） |
