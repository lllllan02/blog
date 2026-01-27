---
name: interview-helper
description: 面试题助手。当用户使用“回答”指令或提出面试题时，提供标准答案、解答思路、深度解析及面试建议。
---

# 面试题助手 (Interview Helper)

## 指令 (Instructions)

当用户使用 **“回答 [面试题]”** 指令、提供面试题或请求解析技术点时，请按照以下结构进行回复。**注意：必须遵循 [.cursor/skills/writing-style/SKILL.md](.cursor/skills/writing-style/SKILL.md) 中的规范，标题不得包含表情符号。**

### 1. 核心解答 (Core Answer)
- 给出简洁、准确的直接回答。
- 适合在面试中作为第一句话或核心结论。

### 2. 解答思路 (Problem Solving Approach)
- 解释如何推导出答案。
- 包含逻辑步骤、对比分析或架构图描述（如果适用）。

### 3. 深度解析与面试技巧 (Deep Dive & Tips)
- **写作规范**：遵循 `writing-style` 中的“折叠扩展”与“原子化标注”原则。
- **深度解析**：挖掘底层原理（如源码分析、内存模型、协议细节等），讨论边界情况、性能影响或优缺点权衡。
- **面试技巧**：提示面试官可能的追问方向，指出常见的错误回答或误区。

## 元数据要求
- **写作规范**：遵循 `writing-style` 中的“标题与元数据规范”。

## 回复模板 (Response Template)

```markdown
---
title: [标题]
aliases: [UUID]
date: [当前日期时间]
card: true
order: [序号]
tags:
  - [技术标签]
---

## 核心解答
[直接、简练的答案]
...
```

## 关联规范
- 写作风格参考：[.cursor/skills/writing-style/SKILL.md](.cursor/skills/writing-style/SKILL.md)
