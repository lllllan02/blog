# Agent Skills 详细规范参考

本文件基于 [Agent Skills Specification](https://agentskills.io/specification) 整理，用于指导生成高质量的技能文档。

## 1. 元数据 (YAML Frontmatter)

*   **name**: 唯一标识符。
    *   长度：最大 64 字符。
    *   格式：仅限小写字母、数字和连字符 `-`。
*   **description**: 描述技能的功能和触发条件。
    *   长度：最大 1024 字符。
    *   **关键点**：必须使用第三人称（例如 "Generates commit messages..." 而不是 "I can generate..."）。

## 2. 目录结构规范

推荐的技能目录结构：
```
skill-name/
├── SKILL.md              # 必填：核心指令
├── reference.md          # 选填：详细参考资料
├── examples.md           # 选填：使用示例
└── scripts/              # 选填：实用脚本
```

## 3. 编写原则

*   **Concise (简洁)**：Agent 已经具备基础能力，只需提供它不知道的特定上下文。
*   **Progressive Disclosure (渐进式披露)**：将核心指令放在 `SKILL.md`，细节放在 `reference.md` 或 `examples.md`。
*   **Degrees of Freedom (自由度)**：
    *   **高**：纯文本指令（适用于代码评审）。
    *   **中**：伪代码/模板（适用于报告生成）。
    *   **低**：具体脚本（适用于脆弱的数据库迁移）。

## 4. 存储位置

*   **个人技能**：`~/.cursor/skills/` (跨项目可用)。
*   **项目技能**：`.cursor/skills/` (项目成员共享)。

> **注意**：不要在 `~/.cursor/skills-cursor/` 中创建技能，那是系统保留目录。
