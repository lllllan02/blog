---
title: defer 的执行顺序
aliases: e7baa7df-51a1-4876-843c-dd3d5a1c6f1f
date: 2026-04-09 21:27:49
card: true
order:
tags: 
  - go
  - interview
---

> **面试官**：请问 defer 的执行顺序是怎样的？defer 和 return 的执行顺序？

## 面试回答

“在 Go 语言中，多个 `defer` 语句的执行顺序是**后进先出**（LIFO）的，也就是最后声明的 `defer` 会最先被执行，类似于栈的结构。

关于 `defer` 和 `return` 的执行顺序，核心在于理解 **`return` 语句并不是一个原子操作**。当函数执行到 `return` 时，实际上会经历三个步骤：首先，将结果赋值给返回值；其次，按照后进先出的顺序执行所有的 `defer` 函数；最后，才真正执行底层的返回指令（RET）。

因此，如果函数使用的是**具名返回值**（Named Return Values），`defer` 函数可以在返回前修改这个返回值，从而影响最终结果；但如果使用的是**匿名返回值**，`return` 时会先将结果拷贝到一个临时变量中，`defer` 修改的只是原来的局部变量，不会影响最终的返回值。”

## 系统讲解

### 核心原则

1. **后进先出 (LIFO)**：多个 `defer` 按照声明的逆序执行。
2. **参数预计算**：`defer` 声明时，其函数的参数会被立即求值并固定下来，而不是等到执行时才求值。
3. **与 return 的执行顺序**：`return` 并非原子操作，分为三步：
   - **第一步**：返回值赋值（将 `return` 后的表达式赋值给返回值变量）
   - **第二步**：执行 `defer` 链表中的函数
   - **第三步**：真正的 `RET` 指令返回

### 代码示例

```go
// 1. defer 的后进先出顺序
func deferOrder() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    defer fmt.Println("3")
    // 输出顺序: 3, 2, 1
}

// 2. defer 与匿名返回值 (不影响返回值)
func anonymousReturn() int {
    i := 0
    defer func() {
        i++
    }()
    return i // 1. 返回值赋值为0; 2. defer将局部变量i加1; 3. 返回0
}

// 3. defer 与具名返回值 (会影响返回值)
func namedReturn() (res int) {
    res = 0
    defer func() {
        res++
    }()
    return res // 1. res赋值为0; 2. defer将res加1; 3. 返回1
}

// 4. defer 参数预计算
func deferArgs() {
    i := 0
    defer fmt.Println(i) // 此时 i 的值 (0) 已经被计算并保存
    i++
    // 输出: 0
}
```

### 亮点与深度

#### 闭包与参数预计算的区别

如果 `defer` 执行的是一个闭包函数，并且在闭包内部引用了外部变量，那么在执行 `defer` 时，它会读取外部变量的最新值。这与将变量作为参数直接传递给 `defer` 函数是不同的。

```go
func deferClosure() {
    i := 0
    defer func() {
        fmt.Println(i) // 闭包引用，输出最新值: 1
    }()
    i++
}
```

#### 底层原理 (Go 1.14 优化)

在 Go 1.14 之前，`defer` 是通过在堆或栈上分配 `_defer` 结构体并将其链接到当前 Goroutine 的 `_defer` 链表中实现的，存在一定的性能开销。

Go 1.14 引入了**开放编码（Open Coded）优化**：对于在编译期就能确定执行次数的 `defer`（例如没有嵌套在循环或条件分支中，且数量不超过 8 个），编译器会直接将 `defer` 的代码内联插入到函数返回前，极大地提升了 `defer` 的性能，使其开销几乎可以忽略不计。
