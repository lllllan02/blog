---
title: Golang 中 make 和 new 的区别
aliases: dc4afc79-b611-4aab-8975-c433d6e66bb0
date: 2026-04-08 17:45:43
card: true
order:
tags:
  - golang
  - interview
---

> **面试官**：请问 Golang 中 make 和 new 有什么区别？

## 面试回答

“在 Go 语言里，`new` 和 `make` 都是用来分配内存的内置函数，但它们的适用场景和返回值完全不同。

简单来说，`new` 是用来**分配内存**的。你传给它一个类型，它就会在内存里划出一块空间，把这块空间初始化为那个类型的零值，然后返回一个指向这块内存的**指针**。它对所有类型都适用，但我们平时主要用它来初始化基本类型或结构体的指针。**如果用 `new` 去分配 map 或 slice，得到的会是一个指向 nil 的指针，直接使用会 panic。**

而 `make` 则是专门用来**初始化** `slice`、`map` 和 `channel` 这三种底层结构比较复杂的类型的。比如 slice 底层有指针、长度和容量，仅仅分配内存并置为零值是没法直接用的。`make` 不仅会分配内存，还会把它们内部的结构都初始化好，让它们处于立即可用的状态。**此外，`make` 还可以接收长度和容量等参数来进行定制化初始化。** 最后，`make` 返回的是这三种类型的**实例本身**，而不是指针。”

## 系统讲解

### 核心对比

| 特性 | `new(T)` | `make(T, args...)` |
| --- | --- | --- |
| **作用** | 为类型 `T` 分配一块内存，并初始化为零值 | 为 `slice`、`map` 或 `channel` 分配内存并完成**内部数据结构的初始化** |
| **返回值** | 返回指向这块内存的指针 `*T` | 返回类型 `T` 的实例本身（引用类型） |
| **适用场景** | 适用于所有类型，但通常用于结构体或基本类型的指针初始化 | **仅**适用于 `slice`、`map` 和 `channel` |

### 代码示例

```go
// 1. new 的使用
p := new(int) // 分配内存，值为 0，返回指针
fmt.Println(*p) // 输出: 0

type User struct {
    Name string
    Age  int
}
u := new(User) // 返回 *User，字段为零值 "" 和 0

// 2. make 的使用
s := make([]int, 0, 10) // 初始化 slice，长度0，容量10
m := make(map[string]int) // 初始化 map
c := make(chan int, 5) // 初始化带缓冲的 channel
```

### 亮点与深度

#### 底层原理

在 Go 编译器的处理中，`new` 会被转换为 `runtime.newobject`，而 `make` 会根据类型转换为 `runtime.makeslice`、`runtime.makemap` 或 `runtime.makechan`。`make` 只用于这三种类型是因为它们底层是复杂的数据结构，必须经过特定的初始化逻辑（如分配底层数组、初始化哈希表桶、创建环形队列等）才能正常工作。

#### 常见追问

**追问：如果用 `new` 来初始化 `map` 会怎样？**

`new(map[string]int)` 会分配一块内存存放 map 指针，并将其初始化为零值（`nil`），返回的是一个指向 `nil` 的指针 `*map[string]int`。如果解引用后尝试写入数据（如 `(*m)["key"] = 1`），会引发 panic：`panic: assignment to entry in nil map`，因为它没有被真正初始化内部的哈希表结构。
