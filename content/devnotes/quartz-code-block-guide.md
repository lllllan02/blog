---
title: 代码块增强功能 (折叠与分组)
date: 2026-01-31
tags: [Quartz, 指南]
---

本项目支持对代码块进行**折叠**和**分组**展示。

## 代码折叠

在代码块语言后添加 `fold` 或 `fold="标题"`。

````markdown
```go fold="Go 示例"
func main() {
    println("Hello, World!")
}
```
````

```go fold="Go 示例"
func main() {
    println("Hello, World!")
}
```

---

## 代码组 (Tabs)

使用 `:::codegroup` 包裹多个代码块，支持使用 `title="标题"` 自定义选项卡名称。

````markdown
:::codegroup
```go title="Go"
println("Hello")
```
```python title="Python"
print("Hello")
```
:::
````

:::codegroup
```go title="Go"
println("Hello")
```
```python title="Python"
print("Hello")
```
:::

---

## 代码组折叠

在 `:::codegroup` 后添加 `fold` 或 `fold="标题"` 可折叠整个代码组。

````markdown
:::codegroup fold="多语言版本"
```go title="Go"
// ...
```
```python title="Python"
# ...
```
:::
````

:::codegroup fold="多语言版本"
```go title="Go"
// ...
```
```python title="Python"
# ...
```
:::
