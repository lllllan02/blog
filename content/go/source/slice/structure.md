---
title: Slice 底层结构
aliases: 2d6c3a7f-f32c-4dcd-9491-374a0bc6359e
date: 2026-02-11 14:02:28
card: true
order: 1
tags:
---

在 Go 语言中，切片（Slice）是我们最常用的数据结构之一。你是否思考过，为什么切片可以动态扩容，而数组却不行？切片在底层究竟是如何表示的？

实际上，切片本身并不是一个动态数组，而是对底层固定长度数组的一个“视图”或“描述符”。观察其底层结构，你会发现它由三个核心部分组成：一个指向底层数组的指针、当前片段的长度，以及该片段的容量（即底层数组从切片起始位置到末尾的最大长度）。

```go
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
```

![[1770716705.excalidraw.png]]