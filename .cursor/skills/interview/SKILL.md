---
name: interview
description: 当用户问 "interview **问题" 时使用该技能。在提问的当前目录下新建一篇文档来记录，文档标题即为问题，问题一般都是面试题，请从面试的角度去考虑问题，回答完整。
---

# Interview Question Skill

本技能用于快速生成高质量的面试题解答文档。

## 触发条件

当用户输入 `interview <问题内容>` 时触发。

## 执行步骤

### 1. 确定上下文 (Context Determination)

1.  **提取问题**: 从用户输入中提取 `<问题内容>`。
2.  **确定目标目录**:
    -   检查当前 IDE 中打开的文件路径。
    -   如果存在打开的文件，使用该文件所在的目录作为目标目录。
    -   如果没有打开的文件，默认使用 `content/interview/` 目录（如果不存在则创建）。

### 2. 生成元数据 (Metadata Generation)

1.  **文件名 (Filename)**: 将提取的中文问题翻译并转换为英文 kebab-case 格式（例如："什么是 Goroutine" -> `what-is-goroutine.md`）。
2.  **UUID (Aliases)**: 生成一个随机的 UUID v4，用于 Frontmatter 的 `aliases` 字段。
3.  **日期 (Date)**: 获取当前的日期和时间，格式为 `YYYY-MM-DD HH:mm:ss`。
4.  **标题 (Title)**: 直接使用用户输入的中文问题作为 `title`。

### 3. 撰写内容 (Drafting Content)

文档内容必须遵循 `.cursor/skills/writing-style/SKILL.md` 中定义的规范。

**Frontmatter 模板**:

```markdown
---
title: <中文问题>
aliases: <UUID>
date: <YYYY-MM-DD HH:mm:ss>
tags: [interview, <相关技术栈标签>]
card: true
---
```

**内容结构建议**:

1.  **问题分析 (Question Analysis)**: 简要分析面试官考察的知识点和意图。
2.  **核心解答 (Core Answer)**:
    -   **口语回答 (Verbal Answer)**: 提供一段 1-2 分钟的口语化回答。**不要使用 Callout**。这段话应模拟真实的面试场景，逻辑清晰，先讲结论，再展开核心点（如“第一点...第二点...”），最后总结。语言要自然、流畅，适合直接朗读或背诵。
    -   **核心结论 (Key Takeaways)**: 给出书面化的精炼总结（TL;DR），适合快速复习。
3.  **详细解析 (Deep Dive)**:
    -   展开讲解原理、机制或流程。
    -   **代码示例**: 必须包含代码示例，使用正确的高亮标签。对于长代码，使用 `fold` 属性。
    -   **对比分析**: 如果涉及对比（如进程 vs 线程），使用表格或 `:::tabgroup`。
4.  **扩展/优缺点 (Extensions / Pros & Cons)**:
    -   讨论优缺点、适用场景或常见的陷阱。
    -   关联知识点。

### 4. Create File (Create File)

请遵循 `.cursor/skills/writing-style/SKILL.md` 中的 **"初始化元数据"** 章节，使用 `clitool` 一键生成文件。

**推荐命令**:
使用 `new card` 模式，并添加 `interview` 标签。

```bash
./clitool new card "<filename>" --title "<中文问题>" --tags "interview,<相关技术栈标签>" --dir "<目标目录>"
```

### 5. 完善内容 (Refine Content)

读取生成的文件，保留 Frontmatter，并根据内容结构建议填充正文。

## 示例

**用户输入**: `interview 什么是 GMP 模型`

**执行动作**:
1.  确定目录: `content/interview/golang/` (假设当前打开了该目录下的文件)
2.  文件名: `what-is-gmp-model.md`
3.  创建文件 `content/interview/golang/what-is-gmp-model.md`，内容包含 GMP 模型的详细解答。
