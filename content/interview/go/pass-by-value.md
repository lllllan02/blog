---
title: Go 是值传递还是引用传递
aliases: e4da93aa-006d-4632-bb90-e7ed628a2a42
date: 2026-04-09 15:51:22
card: true
order:
tags: [go, interview, core]
---

> **面试官**：请问 Golang 中是值传递还是引用传递？

## 面试回答

**Go 语言中所有的参数传递都是值传递（Pass by Value），没有引用传递（Pass by Reference）。**

当我们调用一个函数时，Go 会把实际参数的值**复制**一份，传递给函数的形参。在函数内部对形参的任何修改，都不会直接影响到外部的实际参数本身。

很多人会误以为 Go 有引用传递，是因为在传递 `slice`、`map`、`channel` 或**指针**时，在函数内部修改它们，外部的变量也会跟着改变。但这其实是一种错觉：
1. 当传递指针时，复制的是**指针的值**（即内存地址）。由于形参和实参保存着相同的内存地址，通过形参解引用去修改底层数据，自然会影响到外部。但如果你在函数内把形参指针指向了一个新的地址，外部的实参指针是不会变的。
2. 像 `slice`、`map` 和 `channel` 这样的类型，它们在底层的数据结构中本身就包含了指向实际数据的指针（例如 slice 包含指向底层数组的指针、len 和 cap）。传递它们时，复制的是这个数据结构（Slice Header 等）的副本，所以它们被称为“引用类型”，但传递机制依然是**值传递**。

## 系统讲解

### 1. 值传递与引用传递的核心区别

*   **值传递 (Pass by Value)**：函数接收的是实参的一个**副本**（Copy）。对副本的修改不会影响原变量。
*   **引用传递 (Pass by Reference)**：函数接收的是实参的**内存地址的别名**。对形参的修改会直接反映在原变量上。（C++ 中的 `&` 引用就是真正的引用传递，而 Go 语言不支持这种机制）。

### 2. 为什么会产生“引用传递”的错觉？

在 Go 中，有几种类型被称为**引用类型**（Reference Types），包括 `slice`、`map`、`channel`、`interface` 和 `func`。

以 `slice` 为例，它的底层结构 `SliceHeader` 如下：

```go
type SliceHeader struct {
    Data uintptr // 指向底层数组的指针
    Len  int     // 切片长度
    Cap  int     // 切片容量
}
```

当你把一个 slice 作为参数传递给函数时，Go **复制了这个 `SliceHeader` 结构体**。
*   因为副本中的 `Data` 指针和原 slice 的 `Data` 指针指向同一个底层数组，所以在函数内修改切片元素（如 `s[0] = 100`），外部也能看到变化。
*   但是，如果在函数内对切片执行 `append` 导致扩容，或者修改了 `Len`，这只会改变**副本的 `SliceHeader`**，外部原 slice 的 `Len` 和 `Cap` 是不会改变的。这完美地证明了它是**值传递**。

### 3. 代码示例与证明

#### 示例 1：传递指针依然是值传递

```go
package main

import "fmt"

func modifyPointer(p *int) {
    // 1. 通过指针修改底层数据，外部会受影响
    *p = 100 
    
    // 2. 尝试让指针指向一个新地址，外部不受影响！
    newInt := 200
    p = &newInt 
}

func main() {
    val := 10
    ptr := &val
    
    fmt.Printf("调用前: val = %d, ptr 指向 = %p\n", val, ptr)
    modifyPointer(ptr)
    fmt.Printf("调用后: val = %d, ptr 指向 = %p\n", val, ptr)
    // 输出:
    // 调用前: val = 10, ptr 指向 = 0x1400012a008
    // 调用后: val = 100, ptr 指向 = 0x1400012a008 (指针本身的指向并未改变，证明是值传递)
}
```

#### 示例 2：传递 Slice

```go
package main

import "fmt"

func modifySlice(s []int) {
    // 修改底层数组的元素，外部可见
    s[0] = 99 
    
    // append 改变了副本的 len (甚至可能触发扩容改变底层数组指针)，外部不可见
    s = append(s, 4) 
    fmt.Printf("函数内: s = %v, len = %d\n", s, len(s))
}

func main() {
    mySlice := []int{1, 2, 3}
    modifySlice(mySlice)
    fmt.Printf("函数外: s = %v, len = %d\n", mySlice, len(mySlice))
    // 输出:
    // 函数内: s = [99 2 3 4], len = 4
    // 函数外: s = [99 2 3], len = 3 (外部的 len 没有变，也没有看到追加的 4)
}
```

### 4. 常见追问

**追问 1：既然 slice 是值传递，为什么有时候在函数里 append 后，外部的 slice 数据会被覆盖/出现奇怪的现象？**

如果函数内的 `append` 没有触发底层数组的扩容，它会直接在原底层数组的后续位置写入新数据。虽然外部 slice 的 `len` 没有变（所以直接 `fmt.Println` 看不到新元素），但底层数组已经被修改了。如果外部还有其他 slice 共享这部分底层数组，就会观察到数据被覆盖的“奇怪现象”。这也是为什么在函数中修改 slice 结构时，通常建议将修改后的 slice 作为返回值返回（如 `s = append(s, ...)`）。

**追问 2：为什么 Go 语言只设计了值传递？**

1.  **简单性与一致性**：统一的传值模型让语言规范更简单，开发者不需要去记忆复杂的传参规则（如 C++ 中的传值、传指针、传引用）。
2.  **逃逸分析与垃圾回收**：纯粹的值传递模型有助于编译器进行更精确的逃逸分析（Escape Analysis）。如果支持真正的引用传递，会极大增加逃逸分析的复杂度，进而影响垃圾回收（GC）的效率。