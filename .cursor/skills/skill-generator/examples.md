# Agent Skills 示例与模板

## 示例 1：Git Commit 助手 (High Freedom)

**SKILL.md**
```markdown
---
name: git-commit-helper
description: 分析 git diff 并生成描述性的 commit message。当用户要求编写 commit message 或查看暂存更改时使用。
---

# Git Commit Helper

## Instructions
1. 运行 `git diff --cached` 获取更改。
2. 遵循 Conventional Commits 规范。
3. 保持第一行在 50 字符以内。
```

## 示例 2：文档生成助手 (Document Generator)

**SKILL.md**
```markdown
---
name: api-doc-generator
description: 为 API 接口生成标准 Markdown 文档。当用户提供 API 定义或代码时使用。
---

# API Doc Generator

## Instructions
1. 解析 API 接口定义。
2. 生成 Markdown 文档。
3. **关键格式要求**：生成的文档必须严格遵循本项目的写作规范：
   👉 **[.cursor/skills/writing-style/SKILL.md](../writing-style/SKILL.md)**
   这意味着必须包含正确的 Frontmatter (UUID aliases, tags, date) 和 Callout 样式。
```

## 示例 3：PDF 处理 (Medium Freedom)

**SKILL.md**
```markdown
---
name: pdf-processor
description: 从 PDF 提取文本和表格。当用户提到 PDF 文件、表单或文档提取时使用。
---

# PDF Processor

## Instructions
使用 `pdfplumber` 进行文本提取：
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
```

## 常用模式模板

### 任务清单模式 (Workflow Pattern)
```markdown
## 工作流
- [ ] 步骤 1：分析需求
- [ ] 步骤 2：执行操作
- [ ] 步骤 3：验证结果
```

### 反馈循环模式 (Feedback Loop Pattern)
```markdown
## 验证流程
1. 执行修改。
2. 运行验证脚本：`python scripts/validate.py`。
3. 若失败，修复并重试。
```
