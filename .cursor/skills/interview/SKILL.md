---
name: interview-answer-generator
description: 当用户提出一个面试问题时，自动创建一篇文档，从面试回答的角度来回答这个问题。涵盖解题思路、核心概念、代码示例和常见追问。
---

# 面试题解答生成指南

当用户提出一个技术面试问题，并希望从面试回答的角度来解答时，请遵循以下步骤和结构**自动创建**一篇 Markdown 文档。

## 工作流 (Workflow)

1. **自动创建文档**：
   - 必须自动在合适的目录（如 `content/interview/` 或用户指定的目录）下创建 Markdown 文件来记录该问题。
   - 文档的元数据（Frontmatter）、排版和命名规范，**必须严格参考并遵循** `@.cursor/skills/writing-style/SKILL.md` 中的要求。
   - 优先使用 `./clitool new card "filename" --title "xxx" --dir "content/..."` 来初始化文档（以确保 Frontmatter 中 `card: true`），或者手动生成带有 UUID、`card: true` 和规范 Frontmatter 的文件。
2. **生成回答内容**：
   - 按照下方的“核心原则”在新建的文档中撰写内容。
   - 根据题目的难易程度，从以下三个模板中选择最合适的一个作为参考：
     - 简单题：[template-simple.md](references/template-simple.md)
     - 中等题：[template-medium.md](references/template-medium.md)
     - 困难题：[template-hard.md](references/template-hard.md)

## 核心原则

1. **双轨结构 (核心)**：文档必须包含两大部分：
   - **面试回答**：提供一段可以直接在面试中朗读的、口语化的回答。包含核心结论和关键点，时长控制在1-3分钟，语气自然、自信。
   - **系统讲解**：提供系统的、书面化的知识点整理。包含表格对比、代码示例、底层原理等，作为知识储备。
2. **结构清晰**：按照“总-分-总”的结构，先给出直接的结论，再详细展开，最后总结。善用标题进行分段，不要使用太多的列表。
3. **重点突出**：面试回答需要抓住核心考点，不要长篇大论偏离主题。
4. **灵活调整**：文档结构和篇幅仅供参考，**必须根据题目的难易程度和实际需要灵活调整**。简单问题直接切中要害，复杂问题再进行深度展开。
5. **结合代码**：对于技术问题，必须在系统讲解中提供简洁、可运行的核心代码示例。
6. **深度扩展**：展示技术深度，主动提及相关的底层原理或常见追问（Bonus点）。
7. **简洁专业**：文档标题及各级标题中**不要使用任何表情符号**（Emojis）和**序号**（如 "1.", "2."），全文采用简洁、专业的文字表达。
8. **对比与表格**：需要对比时可以采用表格的形式，更直观地展示差异。
9. **标题层级**：文章正文必须从二级标题（`##`）开始，不要使用一级标题（`#`，已由 Frontmatter 的 title 提供），也不要从三级标题跳跃开始。

## 参考资料 (References)

- **[template-simple.md](references/template-simple.md)**: 简单/基础概念题模板（短篇幅）。
- **[template-medium.md](references/template-medium.md)**: 中等/对比/常规应用题模板（标准篇幅）。
- **[template-hard.md](references/template-hard.md)**: 困难/底层原理/系统设计题模板（长篇幅）。
