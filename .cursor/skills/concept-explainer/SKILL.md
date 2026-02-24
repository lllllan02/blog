---
name: concept-explainer
description: 快速生成技术概念或模糊术语的简短介绍文档。当用户需要了解某个概念、创建知识库条目或撰写概念解释时使用。支持通过 "@concept-explainer [概念]" 快速触发并自动创建文档。
---

# Concept Explainer

## Overview

本技能旨在帮助用户快速理解模糊概念，并生成标准化的、简短的知识库文档。它通过整合网络搜索结果（Wiki、官方文档等），提取核心定义和关键信息，生成符合项目写作规范的 Markdown 文档。

## Workflow

当用户请求解释一个概念或创建概念文档时，请遵循以下流程：

### 1. Analyze & Search
-   确定用户询问的核心概念。
-   使用 `WebSearch` 工具查找权威来源。优先选择：
    -   Wikipedia (维基百科)
    -   MDN Web Docs (前端相关)
    -   官方文档 (如 React, Python 官方文档)
    -   知乎/Stack Overflow 高票回答 (仅作补充)
-   **搜索目标**：找到准确的定义、核心特性、解决了什么问题、典型应用场景。
-   **Deep Dive (Optional)**: 如果搜索结果摘要不足以提供清晰的定义或特性，请使用 `WebFetch` 工具读取完整页面内容（类似于 `baoyu-url-to-markdown` 的功能），以确保信息的准确性和完整性。

### 2. Draft Content
-   **定义 (Definition)**: 提炼出一句最准确的定义。
-   **特性 (Features)**: 总结 3-5 个核心特性或关键点。
-   **场景 (Use Cases)**: 列举 1-3 个典型应用场景。
-   **链接 (References)**: 收集 1-3 个高质量的参考链接。

### 3. Format Output
-   读取并使用 `assets/template.md` 作为文档模板。
-   遵循 `writing-style` 技能的规范：
    -   **Frontmatter**: 包含 `aliases`, `tags`, `date`, `card: true`。
    -   **排版**: 中英文之间加空格，使用标准 Markdown 列表。
    -   **简洁性**: 正文内容控制在 300 字以内（不含代码示例）。
    -   **引用**: 必须包含 Wiki 或专业介绍链接。
-   **Write File**: 将生成的 Markdown 内容写入 `content/wiki/` 目录下。
    -   **Filename**: 必须使用全小写英文，单词间用连字符分隔（kebab-case），例如 `closure.md` 或 `binary-search-tree.md`。
    -   **Title (H1)**: 使用“中文名称 (English Name)”格式，例如 `# 闭包 (Closure)`。

### 4. Self-Review (Quality Check)
-   在输出最终文档前，进行一次自我审查（借鉴 `doc-coauthoring`）：
    -   **Perspective**: 我是否解释了 *为什么* 这个概念存在，而不仅仅是 *什么*？
    -   **Clarity**: 定义是否对初学者足够清晰？
    -   **Completeness**: 是否遗漏了主要的缺点或替代方案？
    -   **Sourcing**: 链接是否权威？是否避免了 SEO 垃圾内容？
    -   **Conciseness**: 是否做到了“最必要、最简短”？

## Guidelines

-   **最必要、最简短**: 不要长篇大论。只保留最核心的信息。
-   **结构化**: 使用列表和短句，避免大段文本。
-   **权威性**: 必须基于搜索到的权威来源，不能仅凭臆测。
-   **可读性**: 确保生成的文档可以直接作为知识库条目使用。

## Example Usage

**User**: "@concept-explainer 闭包"

**Agent Action**:
1.  Search "Closure programming definition MDN wikipedia".
2.  Extract: "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment)."
3.  Fill `assets/template.md`.
4.  **Write File**: Create `content/wiki/closure.md` with the generated content.
