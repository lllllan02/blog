---
name: skill-creator
description: 创建高效 Agent Skills 的指南。当用户想要创建一个新技能（或更新现有技能）以通过专业知识、工作流或工具集成来扩展 AI 能力时，应使用此技能。
license: Complete terms in LICENSE.txt
---

# Skill Creator (技能创建指南)

本技能提供创建高效 Agent Skills 的指导原则与最佳实践。

## 关于 Skills

Skills 是模块化、自包含的包，通过提供专业知识、工作流和工具来扩展 AI (Claude) 的能力。可以将它们视为特定领域或任务的“入职指南”——它们将通用 AI 转变为具备特定过程性知识的专家代理。

### Skills 提供什么

1.  **专业工作流** - 特定领域的多步骤操作流程
2.  **工具集成** - 处理特定文件格式或 API 的指令
3.  **领域专长** - 公司特定的知识、Schema、业务逻辑
4.  **捆绑资源** - 用于复杂和重复任务的脚本、参考文档和素材

## 核心原则 (Core Principles)

### 简洁至上 (Concise is Key)

上下文窗口 (Context Window) 是公共资源。Skills 需要与系统提示词、对话历史、其他 Skills 的元数据以及用户的实际请求共享这一空间。

**默认假设：AI 已经非常聪明。** 只添加 AI 尚未掌握的上下文。对每一条信息都要质疑：“AI 真的需要这个解释吗？”以及“这段话值得消耗这些 Token 吗？”

与其长篇大论，不如提供简洁的示例。

### 设定适当的自由度 (Set Appropriate Degrees of Freedom)

根据任务的脆弱性 (fragility) 和可变性 (variability) 来匹配指令的具体程度：

**高自由度 (文本指令)**：适用于多种方法均有效、决策依赖上下文或通过启发式方法指导的任务。

**中自由度 (伪代码或带参数脚本)**：适用于存在首选模式、允许一定变体或配置影响行为的任务。

**低自由度 (特定脚本、少量参数)**：适用于操作脆弱且易错、一致性至关重要或必须遵循特定顺序的任务。

把 AI 想象成在探索一条路径：悬崖边的窄桥需要具体的护栏（低自由度），而开阔的田野则允许走各种路线（高自由度）。

### Skill 的解剖结构 (Anatomy of a Skill)

每个 Skill 由一个必需的 `SKILL.md` 文件和可选的捆绑资源组成：

```
skill-name/
├── SKILL.md (必需)
│   ├── YAML frontmatter 元数据 (必需)
│   │   ├── name: (必需)
│   │   ├── description: (必需)
│   │   └── compatibility: (可选，极少需要)
│   └── Markdown 指令正文 (必需)
└── Bundled Resources (可选)
    ├── scripts/          - 可执行代码 (Python/Bash/etc.)
    ├── references/       - 旨在按需加载到上下文中的文档
    └── assets/           - 用于输出的文件 (模板, 图标, 字体等)
```

#### SKILL.md (必需)

每个 `SKILL.md` 包含：

-   **Frontmatter** (YAML): 包含 `name` 和 `description` 字段（必需），以及可选字段如 `license`, `metadata`, 和 `compatibility`。AI 仅读取 `name` 和 `description` 来决定何时触发该技能，因此请清晰全面地描述该技能是什么以及何时使用。`compatibility` 字段用于注明环境要求（目标产品、系统包等），但大多数技能不需要。
-   **Body** (Markdown): 使用技能的指令和指南。仅在技能触发**后**加载（如果有的话）。

#### 捆绑资源 (Bundled Resources - 可选)

##### Scripts (`scripts/`)

用于需要确定性可靠性或重复编写的任务的可执行代码 (Python/Bash/etc.)。

-   **何时包含**: 当相同的代码被重复编写，或需要确定性的可靠性时
-   **示例**: 用于 PDF 旋转任务的 `scripts/rotate_pdf.py`
-   **优势**: 节省 Token，确定性强，可以在不加载到上下文的情况下执行
-   **注意**: 脚本可能仍需被 AI 读取以进行修补或环境特定的调整

##### References (`references/`)

旨在按需加载到上下文中以告知 AI 流程和思路的文档及参考资料。

-   **何时包含**: AI 在工作时需要参考的文档
-   **示例**: 金融 Schema 的 `references/finance.md`，公司 NDA 模板的 `references/mnda.md`，公司政策的 `references/policies.md`，API 规范的 `references/api_docs.md`
-   **用例**: 数据库 Schema、API 文档、领域知识、公司政策、详细工作流指南
-   **优势**: 保持 `SKILL.md` 精简，仅在 AI 决定需要时加载
-   **最佳实践**: 如果文件很大 (>10k 词)，在 `SKILL.md` 中包含 grep 搜索模式
-   **避免重复**: 信息应存在于 `SKILL.md` 或 references 文件中，不要两处都有。优先将详细信息放入 references 文件，除非它对技能绝对核心——这能保持 `SKILL.md` 精简，同时使信息可被发现而不占用上下文窗口。在 `SKILL.md` 中只保留核心的程序性指令和工作流指导；将详细的参考资料、Schema 和示例移至 references 文件。

##### Assets (`assets/`)

不打算加载到上下文中，而是用于 AI 产生的输出中的文件。

-   **何时包含**: 当技能需要用于最终输出的文件时
-   **示例**: 品牌资产 `assets/logo.png`，PowerPoint 模板 `assets/slides.pptx`，HTML/React 样板代码 `assets/frontend-template/`，字体 `assets/font.ttf`
-   **用例**: 模板、图片、图标、样板代码、字体、被复制或修改的示例文档
-   **优势**: 将输出资源与文档分离，使 AI 能够使用文件而不必将其加载到上下文中

#### 不要在 Skill 中包含什么

Skill 应仅包含直接支持其功能的基本文件。**不要**创建无关的文档或辅助文件，包括：

-   README.md
-   INSTALLATION_GUIDE.md
-   QUICK_REFERENCE.md
-   CHANGELOG.md
-   等

Skill 应只包含 AI Agent 完成手头工作所需的信息。它不应包含关于创建过程的辅助上下文、设置和测试程序、面向用户的文档等。创建额外的文档文件只会增加混乱和困扰。

### 渐进式披露设计原则 (Progressive Disclosure)

Skills 使用三级加载系统来高效管理上下文：

1.  **Metadata (name + description)** - 始终在上下文中 (~100 词)
2.  **SKILL.md body** - 当技能触发时加载 (<5k 词)
3.  **Bundled resources** - 按需加载 (无限，因为脚本可以在不读入上下文窗口的情况下执行)

#### 渐进式披露模式

保持 `SKILL.md` 正文精简，控制在 500 行以内以最小化上下文膨胀。接近此限制时将内容拆分到单独的文件中。当拆分内容到其他文件时，非常重要的一点是在 `SKILL.md` 中引用它们并清楚地描述何时读取它们，以确保技能的使用者知道它们的存在以及何时使用。

**关键原则：** 当一个技能支持多种变体、框架或选项时，在 `SKILL.md` 中只保留核心工作流和选择指南。将特定于变体的细节（模式、示例、配置）移至单独的 reference 文件中。

**模式 1：高层指南配合引用 (High-level guide with references)**

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber:
[code example]

## Advanced features

- **Form filling**: See [FORMS.md](FORMS.md) for complete guide
- **API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
- **Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
```

AI 仅在需要时加载 `FORMS.md`, `REFERENCE.md`, 或 `EXAMPLES.md`。

**模式 2：特定领域的组织 (Domain-specific organization)**

对于包含多个领域的 Skills，按领域组织内容以避免加载无关上下文：

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

当用户询问销售指标时，AI 只读取 `sales.md`。

同样，对于支持多种框架或变体的技能，按变体组织：

```
cloud-deploy/
├── SKILL.md (workflow + provider selection)
└── references/
    ├── aws.md (AWS deployment patterns)
    ├── gcp.md (GCP deployment patterns)
    └── azure.md (Azure deployment patterns)
```

当用户选择 AWS 时，AI 只读取 `aws.md`。

**模式 3：条件性细节 (Conditional details)**

展示基本内容，链接到高级内容：

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

AI 仅在用户需要这些功能时读取 `REDLINING.md` 或 `OOXML.md`。

**重要准则：**

-   **避免深度嵌套引用** - 保持引用距离 `SKILL.md` 只有一层深度。所有 reference 文件应直接从 `SKILL.md` 链接。
-   **结构化较长的 reference 文件** - 对于超过 100 行的文件，在顶部包含目录，以便 AI 在预览时能看到完整范围。

## Skill 创建流程 (Skill Creation Process)

Skill 创建涉及以下步骤：

1.  通过具体示例理解技能
2.  规划可复用的技能内容 (scripts, references, assets)
3.  初始化技能 (运行 `init_skill.py`)
4.  编辑技能 (实现资源并编写 `SKILL.md`)
5.  打包技能 (运行 `package_skill.py`)
6.  基于实际使用进行迭代

按顺序遵循这些步骤，除非有明确理由不适用。

### 步骤 1：通过具体示例理解技能

仅在已经清楚理解技能的使用模式时才跳过此步骤。即使在处理现有技能时，这一步也很有价值。

要创建高效的技能，必须清楚理解该技能将如何被使用的具体示例。这种理解可以来自直接的用户示例，也可以来自经用户反馈验证的生成示例。

例如，在构建 `image-editor` 技能时，相关问题包括：

-   “`image-editor` 技能应该支持什么功能？编辑、旋转，还有其他吗？”
-   “你能给出一些这个技能如何被使用的例子吗？”
-   “我可以想象用户会要求‘去除这张图片的红眼’或‘旋转这张图片’。你还能想到其他使用这个技能的方式吗？”
-   “用户说什么话应该触发这个技能？”

为了避免让用户感到不知所措，不要在一条消息中问太多问题。从最重要的问题开始，根据需要跟进以获得更好的效果。

当对技能应支持的功能有清晰认识时，结束此步骤。

### 步骤 2：规划可复用的技能内容

为了将具体示例转化为高效的技能，通过以下方式分析每个示例：

1.  考虑如何从头开始执行该示例
2.  识别在重复执行这些工作流时，哪些 scripts、references 和 assets 会有帮助

示例：当构建 `pdf-editor` 技能以处理“帮我旋转这个 PDF”的查询时，分析显示：

1.  旋转 PDF 需要每次都重写相同的代码
2.  在技能中存储一个 `scripts/rotate_pdf.py` 脚本会有帮助

示例：当设计 `frontend-webapp-builder` 技能以处理“给我做一个待办事项应用”或“给我做一个仪表盘来跟踪步数”的查询时，分析显示：

1.  编写前端 Web 应用每次都需要相同的样板 HTML/React 代码
2.  在技能中存储一个包含样板 HTML/React 项目文件的 `assets/hello-world/` 模板会有帮助

示例：当构建 `big-query` 技能以处理“今天有多少用户登录？”的查询时，分析显示：

1.  查询 BigQuery 需要每次重新发现表结构和关系
2.  在技能中存储一个记录表结构的 `references/schema.md` 文件会有帮助

为了确立技能的内容，分析每个具体示例，创建一个要包含的可复用资源列表：scripts, references, 和 assets。

### 步骤 3：初始化技能

此时，是时候实际创建技能了。

仅当正在开发的技能已经存在，且需要迭代或打包时才跳过此步骤。在这种情况下，继续下一步。

当从头开始创建新技能时，始终运行 `init_skill.py` 脚本。该脚本方便地生成一个新的模板技能目录，自动包含技能所需的一切，使技能创建过程更加高效可靠。

用法：

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

该脚本会：

-   在指定路径创建技能目录
-   生成带有正确 frontmatter 和 TODO 占位符的 `SKILL.md` 模板
-   创建示例资源目录：`scripts/`, `references/`, 和 `assets/`
-   在每个目录中添加可自定义或删除的示例文件

初始化后，根据需要自定义或删除生成的 `SKILL.md` 和示例文件。

### 步骤 4：编辑技能

在编辑（新生成或现有的）技能时，请记住该技能是为另一个 AI 实例创建的。包含对 AI 有益且非显而易见的信息。考虑哪些过程性知识、领域特定细节或可复用资产能帮助另一个 AI 实例更有效地执行这些任务。

#### 学习经过验证的设计模式

根据你的技能需求参考这些有用的指南：

-   **多步骤流程**: 参见 `references/workflows.md` 了解顺序工作流和条件逻辑
-   **特定输出格式或质量标准**: 参见 `references/output-patterns.md` 了解模板和示例模式

这些文件包含了高效技能设计的既定最佳实践。

#### 从可复用的技能内容开始

开始实现时，从上面识别出的可复用资源开始：`scripts/`, `references/`, 和 `assets/` 文件。注意这一步可能需要用户输入。例如，在实现 `brand-guidelines` 技能时，用户可能需要提供品牌资产或模板存储在 `assets/` 中，或提供文档存储在 `references/` 中。

添加的脚本必须通过实际运行来测试，以确没有 Bug 且输出符合预期。如果有许多相似的脚本，只需测试代表性样本以确信它们都能工作，同时平衡完成时间。

任何技能不需要的示例文件和目录都应删除。初始化脚本在 `scripts/`, `references/`, 和 `assets/` 中创建示例文件是为了演示结构，但大多数技能不需要全部。

#### 更新 SKILL.md

**写作指南：** 始终使用祈使句/不定式形式。

##### Frontmatter

编写带有 `name` 和 `description` 的 YAML frontmatter：

-   `name`: 技能名称
-   `description`: 这是技能的主要触发机制，帮助 AI 理解何时使用该技能。
    -   包含技能做什么以及何时使用它的具体触发器/上下文。
    -   在此处包含所有“何时使用”的信息 - 不要放在正文中。正文仅在触发后加载，因此正文中的“何时使用此技能”部分对 AI 没有任何帮助。
    -   `docx` 技能的描述示例：“全面的文档创建、编辑和分析，支持修订跟踪、批注、格式保留和文本提取。当 Claude 需要处理专业文档 (.docx 文件) 时使用，用于：(1) 创建新文档，(2) 修改或编辑内容，(3) 处理修订跟踪，(4) 添加批注，或任何其他文档任务”

不要在 YAML frontmatter 中包含任何其他字段。

##### Body

编写使用技能及其捆绑资源的指令。

### 步骤 5：打包技能

一旦技能开发完成，必须将其打包成可分发的 .skill 文件以便与用户共享。打包过程会自动先验证技能，确保其满足所有要求：

```bash
scripts/package_skill.py <path/to/skill-folder>
```

可选的输出目录指定：

```bash
scripts/package_skill.py <path/to/skill-folder> ./dist
```

打包脚本将：

1.  **验证** 技能，自动检查：
    -   YAML frontmatter 格式和必需字段
    -   技能命名约定和目录结构
    -   描述的完整性和质量
    -   文件组织和资源引用

2.  **打包** 技能（如果验证通过），创建一个以技能命名的 .skill 文件（例如 `my-skill.skill`），其中包含所有文件并保持正确的分发目录结构。.skill 文件是一个带有 .skill 扩展名的 zip 文件。

如果验证失败，脚本将报告错误并退出，而不创建包。修复任何验证错误并再次运行打包命令。

### 步骤 6：迭代

测试技能后，用户可能会要求改进。这通常发生在刚使用完技能后，对技能的表现有新鲜的上下文记忆。

**迭代工作流：**

1.  在实际任务中使用技能
2.  注意困难或低效之处
3.  确定 `SKILL.md` 或捆绑资源应如何更新
4.  实施更改并再次测试
