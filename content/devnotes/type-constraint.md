---
title: GO 类型约束
aliases: 34e0abf9-337c-494e-9bdf-8239b7386dd0
date: 2026-02-27 14:01:23
card: false
order:
tags:
  - go
  - generics
---

## 泛型中的运算符限制

在 Go 泛型中，如果我们直接使用 `any` (即 `interface{}`) 作为类型约束，编译器无法确定类型 `T` 是否支持特定的运算符（如 `+`）。

```go
func Sum[T any](a, b T) T {
	return a + b // 编译错误
}
```

![[Pasted image 20260227140145.png]]

如上图所示，编译器会报错：`invalid operation: operator + not defined on a (variable of type T)`。这是因为 `any` 包含了所有类型，而并非所有类型都支持加法运算（例如 `struct` 或 `map`）。

## 使用类型集合 (Type Sets)

为了解决这个问题，我们需要限制 `T` 的范围，使其仅包含支持加法运算的类型。我们可以通过定义一个包含**类型集合**的接口来实现。

```go
type Number interface {
    // 限制类型范围为整数和浮点数
	int | int8 | int16 | int32 | int64 | float32 | float64
}

func Sum[T Number](a, b T) T {
	return a + b // 编译通过
}
```

通过定义 `Number` 接口，我们明确告诉编译器 `T` 只能是指定的数值类型之一，这些类型都支持 `+` 运算，因此代码可以正常编译。

::: [!tip] 扩展知识
在实际开发中，可以使用官方包 `golang.org/x/exp/constraints`，它预定义了 `Ordered`、`Integer`、`Float` 等常用约束，无需手动定义。
:::