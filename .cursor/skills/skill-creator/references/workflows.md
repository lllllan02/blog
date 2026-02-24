# Workflow Patterns (工作流模式)

## 顺序工作流 (Sequential Workflows)

对于复杂任务，将操作分解为清晰、顺序的步骤。通常在 `SKILL.md` 的开头给 AI 一个流程概览会很有帮助：

```markdown
Filling a PDF form involves these steps:
(填写 PDF 表单涉及这些步骤：)

1. Analyze the form (run analyze_form.py)
   (分析表单)
2. Create field mapping (edit fields.json)
   (创建字段映射)
3. Validate mapping (run validate_fields.py)
   (验证映射)
4. Fill the form (run fill_form.py)
   (填写表单)
5. Verify output (run verify_output.py)
   (验证输出)
```

## 条件工作流 (Conditional Workflows)

对于具有分支逻辑的任务，引导 AI 通过决策点：

```markdown
1. Determine the modification type:
   (确定修改类型：)
   **Creating new content?** → Follow "Creation workflow" below
   (创建新内容？ → 遵循下方的“创建工作流”)
   **Editing existing content?** → Follow "Editing workflow" below
   (编辑现有内容？ → 遵循下方的“编辑工作流”)

2. Creation workflow: [steps]
3. Editing workflow: [steps]
```
