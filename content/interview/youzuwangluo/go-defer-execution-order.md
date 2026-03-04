---
title: 2. Go 的 defer 执行顺序
aliases: A598AE4C-F9D6-4289-8CE1-9AF9BBD1B3DB
date: 2026-03-04 14:55:00
tags: [interview, golang, defer]
card: true
order: 2
---

## 问题分析

面试官考察的是对 Go 语言 `defer` 关键字核心机制的理解。这不仅涉及基本的**执行顺序（后进先出）**，还包括**参数求值时机**以及 `defer` 如何**影响命名返回值**。这是一个非常经典的 Go 面试题，通常会有代码陷阱。

## 核心解答

### 口语回答

Go 的 `defer` 执行顺序遵循**后进先出**（LIFO）的原则，就像一个栈。也就是说，最后被 `defer` 的函数会最先执行。

除了执行顺序，还有两个关键点必须注意：
第一，**参数预计算**。`defer` 函数的参数在声明时就会被计算并固定下来，而不是在执行时。
第二，**返回值修改**。`defer` 函数在 `return` 语句之后、函数真正返回之前执行，因此它可以读取并修改**命名返回值**（Named Return Values）。

总结一下就是：LIFO 执行、参数立刻求值、可以修改命名返回值。

### Key Takeaways

| 特性 | 说明 |
| :--- | :--- |
| **执行顺序** | **LIFO (后进先出)**。最后注册的 `defer` 最先执行。 |
| **参数求值** | **Immediate (立即求值)**。`defer` 语句出现时，函数参数已被计算并复制。 |
| **执行时机** | `return` 语句更新返回值 -> **执行 `defer`** -> 函数真正返回。 |
| **返回值修改** | 只能修改**命名返回值** (Named Return Values)。 |

## 详细解析

### 1. 后进先出 (LIFO)

多个 `defer` 语句的执行顺序与声明顺序相反。

```go
package main

import "fmt"

func main() {
	defer fmt.Println("1. First defer")
	defer fmt.Println("2. Second defer")
	defer fmt.Println("3. Third defer")

	fmt.Println("Main function body")
}
```

**输出**:
```text
Main function body
3. Third defer
2. Second defer
1. First defer
```

### 2. 参数预计算 (Arguments Evaluation)

`defer` 函数的参数在 `defer` 语句**声明时**就已经计算好了，而不是在函数退出时。

```go
func main() {
	i := 0
	// i 的值在此时被锁定为 0
	defer fmt.Println("Deferred i:", i) 
	
	i++
	fmt.Println("Current i:", i)
}
```

**输出**:
```text
Current i: 1
Deferred i: 0  // 这里的 i 是 0，不是 1
```

**注意**: 如果传递的是指针或闭包引用，那么 `defer` 执行时看到的是指针指向的最新值。

```go
func main() {
    i := 0
    defer func() {
        // 闭包引用外部变量 i，执行时读取 i 的当前值
        fmt.Println("Deferred closure i:", i) 
    }()
    i++
}
// 输出: Deferred closure i: 1
```

### 3. 修改命名返回值 (Named Return Values)

这是 `defer` 最容易出错的地方。`return` 语句不是原子操作，它分为两步：
1.  给返回值赋值。
2.  执行 `RET` 指令。

`defer` 语句插在步骤 1 和 2 之间。因此，`defer` 可以访问并修改命名返回值。

```go
// Case A: 匿名返回值
func f1() int {
	i := 0
	defer func() {
		i++ // 修改的是局部变量 i，不影响返回值
	}()
	return i // 1. 返回值 = i (0); 2. defer (i变为1); 3. RET (返回0)
}

// Case B: 命名返回值
func f2() (result int) {
	defer func() {
		result++ // 修改的是命名返回值 result
	}()
	return 0 // 1. result = 0; 2. defer (result变为1); 3. RET (返回1)
}

func main() {
	fmt.Println("f1:", f1()) // f1: 0
	fmt.Println("f2:", f2()) // f2: 1
}
```

## 扩展知识

### Panic 与 Recover
`defer` 是 `panic` 和 `recover` 机制的基础。当 `panic` 发生时，程序会中断正常流程，开始逐级执行当前 Goroutine 中已注册的 `defer` 函数。`recover` 只有在 `defer` 函数中调用才有效，用于捕获 `panic` 并恢复程序执行。

```go
func safeCall() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from:", r)
        }
    }()
    panic("something went wrong")
}
```
