---
name: skill-generator
description: 帮助用户创建、编写或优化 Agent Skills。当用户提到“创建 skill”、“编写技能”或需要定义新的 Agent 工作流时使用。基于 Agent Skills 官方规范生成结构化的 SKILL.md 及配套文档。
---

# Skill Generator

本技能旨在帮助用户根据 [Agent Skills 官方规范](https://agentskills.io/home) 创建高质量、结构化的 Agent Skills。

## 核心指令

当接收到创建技能的请求时，请遵循以下流程：

1.  **需求发现**：询问或推断技能的名称、用途、触发场景及存储位置（个人 vs 项目）。
2.  **结构设计**：
    *   `SKILL.md`：包含 YAML 元数据（name, description）和核心指令。
    *   `reference.md`（可选）：存放详细的技术文档或 API 参考。
    *   `examples.md`（可选）：提供具体的输入输出示例。
3.  **编写规范**：
    *   **Description**：必须使用第三人称，包含 WHAT（功能）和 WHEN（触发场景）。
    *   **简洁性**：`SKILL.md` 应保持在 500 行以内，利用渐进式披露（Progressive Disclosure）。
    *   **路径**：始终使用 POSIX 风格路径（如 `scripts/helper.py`）。
4.  **验证与优化**：检查是否符合官方标准，确保指令清晰、无歧义。

## 常用模板

### SKILL.md 结构
```markdown
---
name: [skill-name]
description: [Third-person description including WHAT and WHEN]
---

# [Skill Name]

## Instructions
[Step-by-step guidance]

## Additional Resources
- See [reference.md](reference.md) for details.
- See [examples.md](examples.md) for examples.
```

## 更多资源
- 详细规范请参考 [reference.md](reference.md)
- 示例模板请参考 [examples.md](examples.md)
