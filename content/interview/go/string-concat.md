---
title: 如何高效地拼接字符串
aliases: f621a8f4-2333-4ae0-8927-a461cd2b68f2
date: 2026-04-09 10:33:59
card: true
order:
tags:
  - golang
  - interview
---

> **面试官**：请问在 Golang 中，如何高效地拼接字符串？

## 面试回答

“在 Go 语言中，高效拼接字符串的方法主要取决于具体的应用场景。

如果只是简单地拼接两三个字符串，直接使用 `+` 操作符是最简单直观的，编译器也会对此做优化，性能不错。

但如果在循环中频繁拼接大量字符串，最推荐使用的是 `strings.Builder`。它的底层是一个 byte 切片，通过 `WriteString` 方法追加内容。最后调用 `String()` 方法返回结果时，利用了 `unsafe.Pointer` 直接转换，避免了内存拷贝，性能非常高。如果能提前预估拼接后的总长度，调用 `Grow()` 方法预分配内存，还能进一步减少切片扩容带来的开销。

另外，如果我们已经有了一个字符串切片，需要把它们连起来，使用 `strings.Join` 是最高效的。因为它内部会先遍历计算出总长度，一次性分配好内存，再进行拷贝，避免了多次分配。

至于 `fmt.Sprintf`，虽然功能强大适合复杂数据类型的格式化，但因为底层涉及反射，性能是所有方法中最差的，不建议在对性能要求高的场景下用于纯字符串拼接。”

## 系统讲解

### 核心对比

在 Go 中，字符串是不可变的（Immutable），每次拼接都会生成一个新的字符串，这涉及到内存分配和数据拷贝。因此，选择合适的拼接方式对性能至关重要。

| 拼接方式 | 适用场景 | 性能特点 |
| --- | --- | --- |
| `+` 操作符 | 少量、已知数量的字符串拼接 | 极高。编译器会优化，一次性分配所需内存。但在循环中使用会导致大量内存分配。 |
| `strings.Builder` | 循环拼接、大量字符串拼接 | 极高。Go 1.10 引入，底层是 `[]byte`，转换为字符串时零拷贝。配合 `Grow()` 性能最佳。 |
| `strings.Join` | 已有字符串切片（`[]string`）的拼接 | 极高。内部预先计算总长度，一次性分配内存。 |
| `bytes.Buffer` | 需同时处理字节和字符串的场景 | 较高。与 `strings.Builder` 类似，但转换为字符串时需要一次内存拷贝。 |
| `fmt.Sprintf` | 需要格式化不同类型数据的场景 | 最差。内部使用反射，涉及大量内存分配，仅用于非性能敏感的复杂格式化。 |

### 代码示例

```go
package main

import (
	"bytes"
	"fmt"
	"strings"
)

func main() {
	// 1. + 操作符 (适合少量拼接)
	s1 := "Hello" + " " + "World"

	// 2. strings.Builder (推荐：适合循环或大量拼接)
	var builder strings.Builder
	// 如果已知大概长度，可以提前 Grow 预分配内存，避免扩容开销
	builder.Grow(32) 
	builder.WriteString("Hello")
	builder.WriteString(" ")
	builder.WriteString("Builder")
	s2 := builder.String()

	// 3. strings.Join (适合已有切片)
	parts := []string{"Hello", "Join"}
	s3 := strings.Join(parts, " ")

	// 4. bytes.Buffer (老版本或混合字节操作)
	var buf bytes.Buffer
	buf.WriteString("Hello")
	buf.WriteString(" Buffer")
	s4 := buf.String()

	// 5. fmt.Sprintf (适合复杂格式化，性能最差)
	s5 := fmt.Sprintf("%s %s", "Hello", "Sprintf")

	fmt.Println(s1, s2, s3, s4, s5)
}
```

### 亮点与深度

#### 为什么 `strings.Builder` 比 `bytes.Buffer` 更快？

两者底层都是维护一个 `[]byte` 切片，主要的性能差异在于**将切片转换为字符串**的最后一步：

- `bytes.Buffer` 的 `String()` 方法：
  ```go
  func (b *Buffer) String() string {
      if b == nil {
          return "<nil>"
      }
      return string(b.buf[b.off:]) // 这里发生了内存拷贝
  }
  ```
  因为 Go 中字符串是不可变的，而 byte 切片是可变的，为了防止后续修改切片影响字符串，`string(b)` 会强制进行一次内存拷贝。

- `strings.Builder` 的 `String()` 方法：
  ```go
  func (b *Builder) String() string {
      return *(*string)(unsafe.Pointer(&b.buf)) // 零拷贝转换
  }
  ```
  `strings.Builder` 内部禁止了拷贝（通过 `noCopy` 机制），并利用 `unsafe.Pointer` 直接将底层的 `[]byte` 转换为 `string`。由于没有发生内存拷贝，性能得到了显著提升。

#### 常见追问

**追问：既然 `+` 操作符每次都会创建新字符串，为什么说它在少量拼接时性能很高？**

这是因为 Go 编译器对 `+` 操作符进行了特殊优化。当编译器遇到像 `s = s1 + s2 + s3` 这样的代码时，它不会先拼接 `s1` 和 `s2`，再拼接 `s3`，而是会调用底层的 `concatstrings` 函数。这个函数会**一次性计算出所有待拼接字符串的总长度**，然后分配一块足够大的内存，最后将所有字符串依次拷贝进去。因此，对于少量、固定数量的拼接，它只发生了一次内存分配，效率非常高。
