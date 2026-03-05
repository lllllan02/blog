---
name: writing-style
description: 规范本项目 Markdown 文档的写作风格、元数据（UUID 别名/标签/日期）与排版。当需要新建或改写项目文档（尤其是 content 下的文章）时使用。
---

# Writing Style Guide

本技能用于指导 AI Agent 在本项目中生成、修改或优化 Markdown 文档，确保文档风格统一、结构清晰且符合工程规范。

## 核心原则 (Core Principles)

1.  **完整与连贯 (Completeness & Coherence)**：文章应逻辑通顺、解释详尽。**不要为了追求篇幅短小而牺牲内容的完整性或省略必要的上下文**。
2.  **渐进式披露 (Progressive Disclosure)**：核心结论先行，扩展细节折叠。
3.  **格式克制 (Format Restraint)**：严格控制 Callout、列表和强调的使用频率，格式服务于内容，而非打断内容。
4.  **工程化规范 (Engineering Standards)**：严格遵守元数据、链接和代码块格式。

## 工作流 (Workflow)

当执行文档生成或改写任务时，请遵循以下步骤：

### 1. 确认文档类型
-   **文章/笔记类 (Content)**：通常位于 `content/` 目录下。**必须**包含完整的文章型 Frontmatter。
-   **仓库说明类 (Repo Docs)**：如 `README.md`。可简化 Frontmatter，但仍需遵循排版规范。

### 2. 初始化元数据 (Metadata)
-   **优先使用工具**: 使用 `clitool` 一键生成。
    -   普通文章: `./clitool new doc "filename" --title "Title" --dir "content/..."`
    -   卡片文章: `./clitool new card "filename" --title "Title" --dir "content/..."`
    -   Wiki: `./clitool new card "filename" --title "Title" --wiki "Term1,Term2" --tags "wiki" --dir "content/wiki"`
-   **手动创建时**:
    -   为新文章生成唯一的 UUID (`aliases`)。
    -   使用当前时间（精确到秒）替换模板中的 `<Date...>` 占位符或填充 `date` 字段。
-   **Title**: 在 Frontmatter 中添加 `title` 字段，格式为“中文名称 (English Name)”。
-   从标签库 (`.cursor/data/tags.txt`) 中选择合适的标签。
-   详见 [rules.md](references/rules.md#2-metadata-standards)。

### 3. 构建结构 (Structure)
-   **禁止使用一级标题 (H1)**：正文最高级别标题应为 H2。
-   **自然段落优先**：对于解释性、叙述性内容，优先使用完整的段落。
-   **格式克制**：严格控制 Callout 和列表的使用频率，避免文章碎片化。
-   详见 [rules.md](references/rules.md#1-structure-and-style)。

### 4. 内容编写与格式化 (Drafting & Formatting)
-   **中英文空格**：汉字与英文/数字之间必须保留空格。
-   **代码规范**：指定语言标签，长代码折叠，多语言对比使用 TabGroup。
-   **引用规范**：内部链接使用 `[[uuid|title]]` 格式。
-   可直接复制 [templates.md](references/templates.md) 中的模板。

### 5. 质量自检 (Quality Check)
-   在输出最终结果前，对照 [checklist.md](references/checklist.md) 进行自我审查。
-   确保无 Linting 错误（如标题层级跳跃、行尾空格等）。

## 参考资料 (References)

-   **[rules.md](references/rules.md)**: 详细的写作规范、元数据定义和格式要求。
-   **[templates.md](references/templates.md)**: 可直接使用的 Frontmatter、Callout 和代码块模板。
-   **[checklist.md](references/checklist.md)**: 发布前的质量检查清单。
