---
name: interview-helper
description: 专门用于解答面试题的助手。能够提供标准答案、解答思路、深度知识点解析以及相关面试建议。当用户提出面试题、要求模拟面试或请求解析特定技术概念时使用。
---

# 面试题助手 (Interview Helper)

## 指令 (Instructions)

当用户提供面试题或请求解析技术点时，请按照以下结构进行回复。**注意：必须遵循 [.cursor/skills/writing-style/SKILL.md](.cursor/skills/writing-style/SKILL.md) 中的规范，标题不得包含表情符号。**

### 1. 核心解答 (Core Answer)
- 给出简洁、准确的直接回答。
- 适合在面试中作为第一句话或核心结论。

### 2. 解答思路 (Problem Solving Approach)
- 解释如何推导出答案。
- 包含逻辑步骤、对比分析或架构图描述（如果适用）。

### 3. 深度解析 (Deep Dive)
- 挖掘底层原理（如源码分析、内存模型、协议细节等）。
- **展示规范**：必须使用 `<details>` 标签折叠，除非内容极短。
- 讨论边界情况、性能影响或优缺点权衡。

### 4. 面试技巧与避坑 (Interview Tips)
- 提示面试官通常会如何追问。
- 指出常见的错误回答或误区。

## 元数据要求
- **aliases**: 必须生成一个随机 UUID。
- **tags**: 必须包含 `interview` 和相关技术标签，优先参考 [.cursor/data/tags.txt](.cursor/data/tags.txt)。

## 回复模板 (Response Template)

```markdown
---
title: [标题]
aliases: [UUID]
date: [当前日期时间]
card: true
order: [序号]
tags:
  - interview
  - [技术标签]
---

## 核心解答
[直接、简练的答案]
...
```

## 关联规范
- 写作风格参考：[.cursor/skills/writing-style/SKILL.md](.cursor/skills/writing-style/SKILL.md)
