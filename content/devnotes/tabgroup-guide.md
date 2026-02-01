---
title: 选项卡分组 (TabGroup)
date: 2026-01-31
tags: [Quartz, 指南]
---

本项目支持使用选项卡对内容进行分组展示。

## 使用方法

使用 `:::tabgroup` (或 `:::codegroup`) 包裹内容，并使用 `=== 标题` 分隔不同的选项卡。每个选项卡内可以包含任何 Markdown 内容，包括文本、列表、图片和代码块。

### 示例代码

````markdown
:::tabgroup
=== Go 语言
这里是关于 Go 的说明。
```go
func main() {
    println("Hello, Go!")
}
```

=== Python 语言
这里是关于 Python 的说明。
- 简单易学
- 库丰富
```python
print("Hello, Python!")
```

=== 纯代码块
```go
func main() {
    println("Hello, Go!")
}
```
:::
````

### 渲染效果

:::tabgroup
=== Go 语言
这里是关于 Go 的说明。
```go
func main() {
    println("Hello, Go!")
}
```

=== Python 语言
这里是关于 Python 的说明。
- 简单易学
- 库丰富
```python
print("Hello, Python!")
```

=== 纯代码块
```go
func main() {
    println("Hello, Go!")
}
```
:::
