---
name: wiki
description: 快速生成技术概念或模糊术语的简短介绍文档。当用户需要了解某个概念、创建知识库条目或撰写概念解释时使用。支持通过 "@wiki [概念]" 快速触发并自动创建文档。
---

# Wiki

## 概览 (Overview)

本技能旨在帮助用户快速理解模糊概念，并生成标准化的、简短的知识库文档。它通过整合网络搜索结果（Wiki、官方文档等），提取核心定义和关键信息，生成符合项目写作规范的 Markdown 文档。

## 工作流程 (Workflow)

当用户请求解释一个概念或创建概念文档时，请遵循以下流程：

### 1. 分析与搜索 (Analyze & Search)
-   确定用户询问的核心概念。
-   使用 `WebSearch` 工具查找权威来源。优先选择：
    -   Wikipedia (维基百科)
    -   MDN Web Docs (前端相关)
    -   官方文档 (如 React, Python 官方文档)
    -   知乎/Stack Overflow 高票回答 (仅作补充)
-   **搜索目标**：找到准确的定义、核心特性、解决了什么问题、典型应用场景。
-   **深入挖掘（可选）**: 如果搜索结果摘要不足以提供清晰的定义或特性，请使用 `WebFetch` 工具读取完整页面内容（类似于 `baoyu-url-to-markdown` 的功能），以确保信息的准确性和完整性。

### 2. 起草内容 (Draft Content)
-   **核心定义**: 提炼出一句最准确、最本质的定义。
-   **核心直觉**: 用通俗的语言或类比解释它“解决了什么问题”或“本质是什么”。
-   **关键点 (可选)**: [关键] 仅当概念较复杂（如 OAuth2, B+ Tree）时，才以极简列表形式补充 2-3 个核心要点。对于原子概念（如指令、闭包），**严禁凑数**，直接跳过此项。
-   **参考资料**: 保留至少 1 个最权威的参考链接。

### 3. 创建文件与格式化输出 (Create File & Format Output)
-   **创建文件**: 请遵循 `.cursor/skills/writing-style/SKILL.md` 中的 **"初始化元数据"** 章节，使用 `clitool` 一键生成文件。
    *   **推荐命令**: 使用 `new card` 模式，并添加 `--wiki` 参数和 `wiki` 标签。
    *   **标题规范**: 对于 Wiki 类型的文档，或者特别重要的技术概念，标题**必须**包含英文名称，格式为 `中文名称 (英文名称)`。
    ```bash
    ./clitool new card "<filename>" --title "<中文名称> (<英文名称>)" --wiki "<中文名称>,<英文名称>" --tags "wiki" --dir "content/wiki"
    ```

-   **更新内容**: 读取生成的文件，保留 Frontmatter，并根据 `assets/template.md` 模板重写文件内容。
    -   **简洁性**: 核心内容（不含代码）建议控制在 150 字以内。
    -   **视觉重心**: 确保用户打开文档的第一眼看到的是加粗的定义。
    -   **标题**: **禁止使用一级标题 (H1)**，正文从 H2 开始。
    -   **段落标题**:
        -   **通用标题**: 对于“定义”、“核心直觉”、“关键点”、“参考资料”等通用段落标题，**严禁**添加英文对照（如 `## 定义 (Definition)` 是错误的），直接使用中文即可。
        -   **专有名词**: 仅当段落标题本身是一个需要对照的专有名词时（例如 `## 反应式流 (Reactive Streams)`），才保留英文对照。
    -   **链接**: **禁止手动添加 Wiki 链接**（如 `[[...]]`）。相关术语保持纯文本即可，系统会自动生成链接。
-   **文件名规范**: 必须使用全小写英文，单词间用连字符分隔（kebab-case）。

### 4. 自我审查（质量检查）
-   **“一眼懂”测试**: 用户能否在 3 秒内看懂这个概念？
-   **去废话**: 是否删除了所有不必要的“特性”、“场景”等模板化废话？
-   **直觉性**: 解释是否提供了直觉上的理解，而非仅仅是术语堆砌？

## 指导原则 (Guidelines)

-   **最必要、最简短**: 不要长篇大论。只保留最核心的信息。
-   **结构化**: 使用列表和短句，避免大段文本。
-   **权威性**: 必须基于搜索到的权威来源，不能仅凭臆测。
-   **可读性**: 确保生成的文档可以直接作为知识库条目使用。

## 示例用法 (Example Usage)

**用户**: "@wiki 闭包"

**Agent 动作**:
1.  搜索 "Closure programming definition MDN wikipedia"。
2.  提取核心信息: "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment)."
3.  **创建文件**: 运行 `./clitool new card "closure" --title "闭包 (Closure)" --wiki "闭包,Closure" --tags "wiki" --dir "content/wiki"`。
4.  **读取文件**: 读取 `content/wiki/closure.md` 以获取生成的 `date` 和 `aliases`。
5.  **更新内容**: 使用完整的 wiki 内容重写 `content/wiki/closure.md`，保留生成的 frontmatter。
