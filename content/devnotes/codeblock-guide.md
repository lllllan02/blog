---
title: 代码块增强与折叠
date: 2026-01-31
tags: [Quartz, 指南]
---

本项目支持对代码块进行增强，包括代码折叠等功能。

## 代码块折叠

在代码块语言后添加 `fold` 或 `fold="标题"` 可以实现单个代码块的折叠。

### 使用方法

````markdown
```go fold="Go 示例"
func main() {
    println("Hello, World!")
}
```
````

### 渲染效果

```go fold="Go 示例"
func main() {
    println("Hello, World!")
}
```
