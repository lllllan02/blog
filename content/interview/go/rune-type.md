---
title: rune 类型是什么
aliases: e205c1c3-5aaa-4427-bd8b-9c90e7ac6091
date: 2026-04-09 10:40:04
card: true
order:
tags:
  - golang
  - interview
---

> **面试官**：请问 Golang 中的 rune 类型是什么？它和 byte 有什么区别？

## 面试回答

“在 Go 语言中，`rune` 是 `int32` 的一个类型别名。它主要用来表示一个 Unicode 码点（Code Point），也就是我们常说的一个『字符』。

因为 Go 语言里的字符串底层是基于 UTF-8 编码的字节序列（`[]byte`）。对于纯英文字符，一个字符只占 1 个字节；但如果字符串里包含了中文、日文或者 Emoji 等复杂字符，在 UTF-8 编码下可能会占用 3 到 4 个字节。

如果我们直接用索引去遍历或者截取这种包含中文的字符串，取出来的其实是单个字节，很容易导致乱码。这时候我们就需要用到 `rune`。我们可以把字符串转换成 `[]rune` 切片，或者直接使用 `for range` 循环去遍历字符串（它会自动将字符串解码为一个个 `rune`）。这样每次取出来的就是一个完整的 Unicode 字符，无论它是英文还是中文，都只占一个 `rune` 的位置。

简单总结就是：处理纯 ASCII 字符或者底层二进制数据时用 `byte`；只要涉及到处理包含多语言的文本、需要按『字符』维度进行操作时，就一定要用 `rune`。”

## 系统讲解

### 核心对比

在 Go 语言的源码中，`byte` 和 `rune` 都是内置类型的别名（Alias）：

```go
// byte is an alias for uint8 and is equivalent to uint8 in all ways.
// It is used, by convention, to distinguish byte values from 8-bit unsigned integer values.
type byte = uint8

// rune is an alias for int32 and is equivalent to int32 in all ways.
// It is used, by convention, to distinguish character values from integer values.
type rune = int32
```

| 特性 | `byte` | `rune` |
| --- | --- | --- |
| **底层类型** | `uint8` (无符号 8 位整数) | `int32` (有符号 32 位整数) |
| **占用空间** | 1 字节 | 4 字节 |
| **代表含义** | 代表一个原始的字节（ASCII 字符） | 代表一个 Unicode 码点（完整的字符） |
| **适用场景** | 处理底层二进制流、网络传输、纯英文字符串 | 处理多语言文本、中文字符串截取与遍历 |

### 代码示例

#### 1. 长度与遍历的差异

```go
package main

import (
	"fmt"
	"unicode/utf8"
)

func main() {
	s := "Go语言" // 包含 2 个英文字母和 2 个汉字

	// 1. len() 函数返回的是字节数 (byte 数量)
	// 英文占 1 字节，中文在 UTF-8 中通常占 3 字节 -> 2*1 + 2*3 = 8
	fmt.Println("字节长度:", len(s)) // 输出: 8

	// 2. 获取真实的字符数量 (rune 数量)
	fmt.Println("字符长度:", utf8.RuneCountInString(s)) // 输出: 4

	// 3. 使用普通 for 循环遍历 (按 byte 遍历，中文会乱码)
	fmt.Print("按 byte 遍历: ")
	for i := 0; i < len(s); i++ {
		fmt.Printf("%X ", s[i]) // 输出底层的十六进制字节
	}
	fmt.Println()

	// 4. 使用 for range 遍历 (自动按 rune 遍历)
	fmt.Print("按 rune 遍历: ")
	for i, r := range s {
		// 注意：这里的 i 是字节索引，可能会跳跃（如 0, 1, 2, 5）
		fmt.Printf("%c ", r) // 输出: G o 语 言
	}
	fmt.Println()
}
```

#### 2. 字符串安全截取

如果直接截取包含中文的字符串，可能会截断一个中文字符的字节，导致乱码（如 `s[:3]`）。正确的做法是转换为 `[]rune` 后再截取：

```go
s := "Go语言面试题"

// 错误截取：取前 3 个字符（实际取了前 3 个字节）
// fmt.Println(s[:3]) // 输出: Go (乱码)

// 正确截取：转换为 []rune
runes := []rune(s)
fmt.Println(string(runes[:3])) // 输出: Go语
```

### 亮点与深度

#### Unicode 码点与 UTF-8 的关系

很多初学者会混淆 Unicode 和 UTF-8。
- **Unicode** 是一个字符集（Charset），它给世界上几乎所有的字符都分配了一个唯一的数字编号，这个编号就叫**码点（Code Point）**。在 Go 中，这个码点就是用 `rune`（`int32`）来存储的，因为目前 Unicode 的最大码点用 32 位整数完全装得下。
- **UTF-8** 是一种**编码规则（Encoding）**，它规定了如何将这些 Unicode 码点转换成计算机底层的二进制字节序列（`[]byte`）进行存储和传输。UTF-8 是一种变长编码，根据码点的大小，使用 1 到 4 个字节不等来表示一个字符。

Go 语言的创造者 Rob Pike 和 Ken Thompson 也是 UTF-8 编码的联合发明人，因此 Go 语言在设计之初就将 UTF-8 作为字符串的默认底层编码，并引入了 `rune` 来优雅地处理 Unicode 字符。

#### 常见追问

**追问：将 `string` 转换为 `[]rune` 有什么性能开销吗？**

有较大的性能开销。将 `string` 转换为 `[]rune` 时，Go 运行时需要遍历整个字符串，将 UTF-8 编码的变长字节序列逐一解码为 32 位的 Unicode 码点，并分配一块全新的内存来存放这个 `[]rune` 切片。这涉及到**O(N) 的时间复杂度**和**大量的内存分配与拷贝**。

因此，在对性能要求极高的场景下，应尽量避免频繁进行 `string` 到 `[]rune` 的转换。如果只是为了遍历，直接使用 `for range string` 是最高效的，因为它在迭代过程中实时解码，不需要分配额外的切片内存。如果需要频繁按字符索引访问，可以考虑在初始化时转换一次并缓存结果。