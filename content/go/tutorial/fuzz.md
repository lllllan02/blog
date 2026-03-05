---
title: Go Fuzzing 教程
aliases: 2010d84c-2809-45d8-8a83-89a143f1bea7
date: 2026-03-05 14:20:30
card: false
order:
tags: [go, testing, fuzzing]
---

> [Tutorial: Getting started with fuzzing](https://go.dev/doc/tutorial/fuzz)

本教程介绍了 Go 中模糊测试（fuzzing）的基础知识。通过模糊测试，随机数据会作为输入运行你的测试，以试图找到漏洞或导致崩溃的输入。模糊测试可以发现的漏洞示例包括 SQL 注入、缓冲区溢出、拒绝服务和跨站脚本攻击。

在本教程中，你将为一个简单的函数编写模糊测试，运行 `go` 命令，并调试和修复代码中的问题。

## 前置条件

*   **安装 Go 1.18 或更高版本**。
*   **支持模糊测试的环境**。Go 模糊测试目前仅在 AMD64 和 ARM64 架构上支持覆盖率插桩。

## 添加待测试代码

我们将添加一个反转字符串的函数，稍后对其进行模糊测试。

### 编写代码

在 `fuzz` 目录下创建一个名为 `main.go` 的文件。


```go
package main

import "fmt"

func main() {
    input := "The quick brown fox jumped over the lazy dog"
    rev := Reverse(input)
    doubleRev := Reverse(rev)
    fmt.Printf("original: %q\n", input)
    fmt.Printf("reversed: %q\n", rev)
    fmt.Printf("reversed again: %q\n", doubleRev)
}

func Reverse(s string) string {
    b := []byte(s)
    for i, j := 0, len(b)-1; i < len(b)/2; i, j = i+1, j-1 {
        b[i], b[j] = b[j], b[i]
    }
    return string(b)
}
```

### 运行代码

`go run .` 输出应如下所示：

```text
original: "The quick brown fox jumped over the lazy dog"
reversed: "god yzal eht revo depmuj xof nworb kciuq ehT"
reversed again: "The quick brown fox jumped over the lazy dog"
```

## 添加单元测试

### 编写代码

在 `fuzz` 目录下创建一个名为 `reverse_test.go` 的文件。

```go
package main

import (
    "testing"
)

func TestReverse(t *testing.T) {
    testcases := []struct {
        in, want string
    }{
        {"Hello, world", "dlrow ,olleH"},
        {" ", " "},
        {"!12345", "54321!"},
    }
    for _, tc := range testcases {
        rev := Reverse(tc.in)
        if rev != tc.want {
            t.Errorf("Reverse: %q, want %q", rev, tc.want)
        }
    }
}
```

### 运行代码

`go test` 输出应为 `PASS`。

## 添加模糊测试

单元测试的局限性在于开发者必须手动添加每个输入。模糊测试的好处是它可以为你的代码生成输入，并可能识别出你未考虑到的边缘情况。

### 编写代码

将 `reverse_test.go` 中的单元测试替换为以下模糊测试：

```go
package main

import (
    "testing"
    "unicode/utf8"
)

func FuzzReverse(f *testing.F) {
    testcases := []string{"Hello, world", " ", "!12345"}
    for _, tc := range testcases {
        f.Add(tc)  // 使用 f.Add 提供种子语料库
    }
    f.Fuzz(func(t *testing.T, orig string) {
        rev := Reverse(orig)
        doubleRev := Reverse(rev)
        if orig != doubleRev {
            t.Errorf("Before: %q, after: %q", orig, doubleRev)
        }
        if utf8.ValidString(orig) && !utf8.ValidString(rev) {
            t.Errorf("Reverse produced invalid UTF-8 string %q", rev)
        }
    })
}
```

注意模糊测试与单元测试的区别：
*   函数名以 `FuzzXxx` 开头，参数为 `*testing.F`。
*   使用 `f.Add` 提供种子语料库（seed corpus）。
*   使用 `f.Fuzz` 执行模糊测试目标函数。

### 运行代码

1.  运行模糊测试（不带 fuzzing），确保种子输入通过：
    ```bash
    go test
    ```

2.  运行模糊测试：
    ```bash
    go test -fuzz=Fuzz
    ```

    你可能会看到类似以下的失败信息：
    ```text
    fuzz: minimizing 38-byte failing input file...
    --- FAIL: FuzzReverse (0.01s)
        --- FAIL: FuzzReverse (0.00s)
            reverse_test.go:20: Reverse produced invalid UTF-8 string "\x9c\xdd"
    ```

    这表明模糊测试发现了一个导致失败的输入。

## 修复无效字符串错误

### 诊断错误

`Reverse` 函数按字节反转字符串。如果输入包含多字节字符（如中文），按字节反转会破坏 UTF-8 编码。

### 修复代码

修改 `main.go` 中的 `Reverse` 函数，使其按 `rune`（字符）遍历：

```go {2}
func Reverse(s string) string {
    r := []rune(s)
    for i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {
        r[i], r[j] = r[j], r[i]
    }
    return string(r)
}
```

### 再次运行

1.  运行测试 `go test` 测试应该通过。
2.  再次运行模糊测试 `go test -fuzz=Fuzz` 这次可能会发现另一个错误：

```text
--- FAIL: FuzzReverse (0.02s)
    --- FAIL: FuzzReverse (0.00s)
        reverse_test.go:33: Before: "\x91", after: ""
```

## 修复双重反转错误

### 诊断错误

输入字符串可能包含无效的 UTF-8 字节。当转换为 `[]rune` 时，Go 会将无效字节替换为替换字符 ``（U+FFFD）。因此，反转后再反转回来的字符串与原始字符串不匹配。

### 修复代码

修改 `Reverse` 函数，如果输入不是有效的 UTF-8，则返回错误。

1.  修改 `main.go`：

```go {19-21}
package main

import (
    "errors"
    "fmt"
    "unicode/utf8"
)

func main() {
    input := "The quick brown fox jumped over the lazy dog"
    rev, revErr := Reverse(input)
    doubleRev, doubleRevErr := Reverse(rev)
    fmt.Printf("original: %q\n", input)
    fmt.Printf("reversed: %q, err: %v\n", rev, revErr)
    fmt.Printf("reversed again: %q, err: %v\n", doubleRev, doubleRevErr)
}

func Reverse(s string) (string, error) {
    if !utf8.ValidString(s) {
        return s, errors.New("input is not valid UTF-8")
    }
    r := []rune(s)
    for i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {
        r[i], r[j] = r[j], r[i]
    }
    return string(r), nil
}
```

2.  修改 `reverse_test.go` 以处理错误：

```go
package main

import (
    "testing"
    "unicode/utf8"
)

func FuzzReverse(f *testing.F) {
    testcases := []string{"Hello, world", " ", "!12345"}
    for _, tc := range testcases {
        f.Add(tc)
    }
    f.Fuzz(func(t *testing.T, orig string) {
        rev, err1 := Reverse(orig)
        if err1 != nil {
            return
        }
        doubleRev, err2 := Reverse(rev)
        if err2 != nil {
            return
        }
        if orig != doubleRev {
            t.Errorf("Before: %q, after: %q", orig, doubleRev)
        }
        if utf8.ValidString(orig) && !utf8.ValidString(rev) {
            t.Errorf("Reverse produced invalid UTF-8 string %q", rev)
        }
    })
}
```

### 最终运行

运行模糊测试一段时间（例如 30 秒）：

```bash
go test -fuzz=Fuzz -fuzztime 30s
```

应该会显示 `PASS`。

## 总结

你已经完成了 Go 模糊测试的入门教程！模糊测试可以帮助你发现单元测试难以覆盖的边缘情况和漏洞。

### 完整代码

:::tabgroup
=== main.go
```go
package main

import (
    "errors"
    "fmt"
    "unicode/utf8"
)

func main() {
    input := "The quick brown fox jumped over the lazy dog"
    rev, revErr := Reverse(input)
    doubleRev, doubleRevErr := Reverse(rev)
    fmt.Printf("original: %q\n", input)
    fmt.Printf("reversed: %q, err: %v\n", rev, revErr)
    fmt.Printf("reversed again: %q, err: %v\n", doubleRev, doubleRevErr)
}

func Reverse(s string) (string, error) {
    if !utf8.ValidString(s) {
        return s, errors.New("input is not valid UTF-8")
    }
    r := []rune(s)
    for i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {
        r[i], r[j] = r[j], r[i]
    }
    return string(r), nil
}
```

=== reverse_test.go

```go
package main

import (
    "testing"
    "unicode/utf8"
)

func FuzzReverse(f *testing.F) {
    testcases := []string{"Hello, world", " ", "!12345"}
    for _, tc := range testcases {
        f.Add(tc)
    }
    f.Fuzz(func(t *testing.T, orig string) {
        rev, err1 := Reverse(orig)
        if err1 != nil {
            return
        }
        doubleRev, err2 := Reverse(rev)
        if err2 != nil {
            return
        }
        if orig != doubleRev {
            t.Errorf("Before: %q, after: %q", orig, doubleRev)
        }
        if utf8.ValidString(orig) && !utf8.ValidString(rev) {
            t.Errorf("Reverse produced invalid UTF-8 string %q", rev)
        }
    })
}
```
:::