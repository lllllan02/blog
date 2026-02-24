# Output Patterns (输出模式)

当 Skills 需要产生一致、高质量的输出时，请使用这些模式。

## 模板模式 (Template Pattern)

提供输出格式的模板。根据你的需求匹配严格程度。

**用于严格要求 (如 API 响应或数据格式):**

```markdown
## Report structure (报告结构)

ALWAYS use this exact template structure:
(始终使用此确切的模板结构：)

# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]
(一段话概述关键发现)

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data
- Finding 3 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```

**用于灵活指导 (当需要适应性时):**

```markdown
## Report structure (报告结构)

Here is a sensible default format, but use your best judgment:
(这是一个合理的默认格式，但请运用你的最佳判断：)

# [Analysis Title]

## Executive summary
[Overview]

## Key findings
[Adapt sections based on what you discover]
(根据发现调整章节)

## Recommendations
[Tailor to the specific context]
(根据具体语境定制)

Adjust sections as needed for the specific analysis type.
(根据具体分析类型调整章节。)
```

## 示例模式 (Examples Pattern)

对于输出质量依赖于参考示例的 Skills，提供输入/输出对：

```markdown
## Commit message format (提交信息格式)

Generate commit messages following these examples:
(参照这些示例生成提交信息：)

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly in reports
Output:
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

Follow this style: type(scope): brief description, then detailed explanation.
(遵循此风格：type(scope): 简短描述，然后是详细解释。)
```

相比于单纯的描述，示例能帮助 AI 更清晰地理解期望的风格和细节程度。
