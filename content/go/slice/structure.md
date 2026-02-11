---
title: Slice 底层结构
aliases: 2d6c3a7f-f32c-4dcd-9491-374a0bc6359e
date: 2026-02-11 14:02:28
card: false
order: 1
tags:
---

切片是数组段的描述符。它由指向数组的指针、段的长度及其容量（段的最大长度）组成。

```go
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
```

![[1770716705.excalidraw.png]]