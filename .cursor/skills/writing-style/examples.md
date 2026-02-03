# Writing Style Examples

本文件提供可复制的模板与片段示例。字段约束以 `reference.md` 为准。

## 1. 文章/笔记类 frontmatter 模板

```markdown
---
title: <SIMPLE_TITLE_DIRECT_TO_POINT: e.g., "协程栈 Goroutine Stack" (概念) or "如何优化协程内存占用" (问题)>
aliases: <UUIDv4:GENERATED>
date: <SYSTEM_NOW:YYYY-MM-DD HH:mm:ss>
order: <AUTO:CURRENT_DIR_FILE_COUNT_PLUS_1>
card: <BOOL:IS_CONCRETE_QA_OR_KNOWLEDGE_POINT_FOR_FLASHCARDS>
tags:
  # 从正文提取重点/关键词，并映射到 `.cursor/data/tags.txt` 中的标签
  - <EXTRACTED_FROM_CONTENT:tag>
---
```

## 2. Callout 模板

### 2.1 折叠（推荐用于扩展/过长内容）

```markdown
::: [!abstract]- 一句话结论
这里写扩展解释（可长，可包含代码）。
:::
```

```markdown
::: [!tip]- 面试怎么说
这里写面试表述、踩坑提醒或记忆点。
:::
```

### 2.2 不折叠（推荐用于短的重点提示）

```markdown
::: [!tip] 重点结论/核心观点
这里写补充说明、背景资料或进一步解释。
:::
```

## 3. 语法增强示例

### 3.1 代码块折叠 (Code Fold)

使用 `fold` 或 `fold="标题"` 标记在代码块首行。

```markdown
`​``go fold="main.go"
package main
func main() {
    println("Hello World")
}
`​``
```

### 3.2 标签组 (TabGroup)

用于展示多语言代码或多维度对比。支持 `:::tabgroup`, `:::codegroup`, `:::code-group`。

```markdown
:::tabgroup
=== Go
`​``go
fmt.Println("Hello")
`​``
=== Python
`​``python
print("Hello")
`​``
:::
```

## 4. 链接示例

- 内部链接：`[[<UUIDv4:TARGET_ALIASES>|显示标题]]`
- 外部链接：`[Quartz](https://quartz.jzhao.xyz/)`
