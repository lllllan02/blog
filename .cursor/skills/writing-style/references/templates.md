# Templates & Snippets

## 1. Frontmatter Template

适用于新建文章/笔记：

```markdown
---
title: <Title: 简洁直观，概念类可用"中文 英文">
aliases: <UUIDv4: 生成唯一的 UUID>
date: <Date: YYYY-MM-DD HH:mm:ss>
order: <Order: 默认留空或根据目录文件数+1>
card: <Bool: 是否适合作为 Flashcard 复习>
tags:
  - <Tags>
---
```

## 2. Callout Templates

### 2.1 折叠型 (推荐用于扩展/长内容)

```markdown
::: [!abstract]- 核心结论 / TL;DR
这里是详细的解释、背景知识或较长的推导过程。
默认折叠，以免占据过多篇幅。
:::
```

```markdown
::: [!example]- 完整代码示例
这里放置较长的代码块或具体的实操步骤。
:::
```

### 2.2 非折叠型 (推荐用于短提示/警告)

```markdown
::: [!tip] 技巧
这是一个简短的提示或最佳实践。
:::
```

```markdown
::: [!warning] 注意
这是一个需要特别注意的警告或反模式。
:::
```

## 3. Code Block Templates

### 3.1 带折叠的代码块

````markdown
`​``go fold="main.go"
package main

import "fmt"

func main() {
    // 较长的代码...
    fmt.Println("Hello")
}
`​``
````

### 3.2 多语言标签组 (TabGroup)

````markdown
:::tabgroup
=== Go
`​``go
fmt.Println("Hello")
`​``
=== Python
`​``python
print("Hello")
`​``
=== Rust
`​``rust
println!("Hello");
`​``
:::
````

## 4. Link Template

```markdown
<!-- 内部引用 (使用 UUID) -->
[[<UUID>|<显示文本>]]

<!-- 外部链接 -->
[<链接标题>](<URL>)
```
