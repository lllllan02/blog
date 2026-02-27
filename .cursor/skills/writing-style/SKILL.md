---
name: writing-style
description: 规范本项目 Markdown 文档的写作风格、元数据（UUID 别名/标签/日期）与排版。当需要新建或改写项目文档（尤其是 content 下的文章）时使用。
---

# Writing Style Guide

本技能用于指导 AI Agent 在本项目中生成、修改或优化 Markdown 文档，确保文档风格统一、结构清晰且符合工程规范。

## 核心原则 (Core Principles)

1.  **简洁至上 (Concise is Key)**：优先使用列表和短句，避免冗长段落。
2.  **渐进式披露 (Progressive Disclosure)**：核心结论先行，扩展细节折叠。
3.  **工程化规范 (Engineering Standards)**：严格遵守元数据、链接和代码块格式。

## 工作流 (Workflow)

当执行文档生成或改写任务时，请遵循以下步骤：

### 1. 确认文档类型
-   **文章/笔记类 (Content)**：通常位于 `content/` 目录下。**必须**包含完整的文章型 Frontmatter。
-   **仓库说明类 (Repo Docs)**：如 `README.md`。可简化 Frontmatter，但仍需遵循排版规范。

### 2. 初始化元数据 (Metadata)
-   **优先使用工具**: 如果可能，使用 `./clitool create-file "path/to/file.md" "Title"` 创建文件，以自动生成准确的 `date` 和 `aliases` (UUID)。
-   **手动创建时**:
    -   为新文章生成唯一的 UUID (`aliases`)。
    -   使用当前时间（精确到秒）替换模板中的 `<Date...>` 占位符或填充 `date` 字段。
-   **Title**: 在 Frontmatter 中添加 `title` 字段，格式为“中文名称 (English Name)”。
-   从标签库 (`.cursor/data/tags.txt`) 中选择合适的标签。
-   详见 [rules.md](references/rules.md#2-metadata-standards)。

### 3. 构建结构 (Structure)
-   **禁止使用一级标题 (H1)**：正文最高级别标题应为 H2。
-   优先使用无序/有序列表承载信息。
-   使用 Callout 区分重点、补充和扩展内容。
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
