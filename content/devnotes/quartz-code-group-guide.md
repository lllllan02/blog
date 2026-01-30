---
title: 代码组 (Code Group) 功能使用指南
---

为了方便在文档中展示多语言示例或对比代码，我为本博客系统实现了 **代码组 (Code Group)** 功能。

## 语法格式

使用 `:::codegroup` 块包裹多个标准的 Markdown 代码块。每个代码块的标题可以通过在语言标识符后添加空格和标题文字来定义。

````markdown
:::codegroup
```python Python 示例
def hello():
    print("Hello, CodeGroup!")

hello()
```

```javascript JavaScript 示例
function hello() {
  console.log("Hello, CodeGroup!");
}

hello();
```

```go Go 示例
package main

import "fmt"

func main() {
    fmt.Println("Hello, CodeGroup!")
}
```
:::
````

## 实际效果演示

:::codegroup
```python Python 示例
def hello():
    print("Hello, CodeGroup!")

hello()
```

```javascript JavaScript 示例
function hello() {
  console.log("Hello, CodeGroup!");
}

hello();
```

```go Go 示例
package main

import "fmt"

func main() {
    fmt.Println("Hello, CodeGroup!")
}
```
:::

## 注意事项

*   请确保 `:::codegroup` 和内部的代码块之间有空行（虽然插件已做处理，但保持良好的 Markdown 习惯更稳妥）。
*   代码组必须以 `:::` 结尾。
