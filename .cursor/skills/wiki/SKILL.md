---
name: wiki
description: 快速生成技术概念或模糊术语的简短介绍文档。当用户需要了解某个概念、创建知识库条目或撰写概念解释时使用。支持通过 "@wiki [概念]" 快速触发并自动创建文档。
---

# Wiki

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
-   **核心定义 (Core Definition)**: 提炼出一句最准确、最本质的定义。
-   **核心直觉 (Core Intuition)**: 用通俗的语言或类比解释它“解决了什么问题”或“本质是什么”。
-   **按需补充 (Optional Context)**: [关键] 仅当概念较复杂（如 OAuth2, B+ Tree）时，才以极简列表形式补充 2-3 个核心要点。对于原子概念（如指令、闭包），**严禁凑数**，直接跳过此项。
-   **链接 (Reference)**: 仅保留 1 个最权威的参考链接。

### 3. Format Output
-   读取并使用 `assets/template.md` 作为文档模板。
-   遵循 `writing-style` 技能的规范：
    -   **Frontmatter**: 包含 `title` (中文名称 (English Name)), `wiki` (包含中文名称、英文缩写或核心术语的数组), `aliases` (必须包含一个生成的 UUID 别名), `tags`, `date`, `card: true`。
    -   **简洁性**: 核心内容（不含代码）建议控制在 150 字以内。
    -   **视觉重心**: 确保用户打开文档的第一眼看到的是加粗的定义。
    -   **标题**: **禁止使用一级标题 (H1)**，正文从 H2 开始。
-   **Write File**: 将生成的 Markdown 内容写入 `content/wiki/` 目录下。
-   **Filename**: 必须使用全小写英文，单词间用连字符分隔（kebab-case）。

### 4. Self-Review (Quality Check)
-   **The "One-Glance" Test**: 用户能否在 3 秒内看懂这个概念？
-   **No Fluff**: 是否删除了所有不必要的“特性”、“场景”等模板化废话？
-   **Intuition**: 解释是否提供了直觉上的理解，而非仅仅是术语堆砌？

## Guidelines

-   **最必要、最简短**: 不要长篇大论。只保留最核心的信息。
-   **结构化**: 使用列表和短句，避免大段文本。
-   **权威性**: 必须基于搜索到的权威来源，不能仅凭臆测。
-   **可读性**: 确保生成的文档可以直接作为知识库条目使用。

## Example Usage

**User**: "@wiki 闭包"

**Agent Action**:
1.  Search "Closure programming definition MDN wikipedia".
2.  Extract: "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment)."
3.  Fill `assets/template.md`.
4.  **Write File**: Create `content/wiki/closure.md` with the generated content.
