# Article Condenser Reference

## Formatting Rules

### 1. Frontmatter Specification

Every generated document must start with this YAML frontmatter:

```yaml
---
title: "Article Title"
aliases: <UUID-v4>  # Must be a unique UUID v4 (lowercase)
date: <YYYY-MM-DD HH:mm:ss>
card: false
order: 
tags:
  - tag1
  - tag2
---
```

### 2. Citation Style

Immediately after the frontmatter, provide the source link:

```markdown
> [Original Article Title](URL)

(Optional: A one-sentence summary or lead-in)
```

### 3. Structural Elements

#### Headings
- Use `##` (H2) for main sections.
- Use `###` (H3) for subsections.
- **Do not** use H1 (`#`) as the title is already in the frontmatter.

#### Callouts
Use callouts to highlight key information. Format: `::: [!type] Title`

| Type | Usage |
| :--- | :--- |
| `tip` | Core concepts, best practices, key takeaways. |
| `question` | Critical questions the article answers. |
| `warning` | Pitfalls, warnings, anti-patterns. |
| `info` | Supplementary info, background context. |
| `abstract` | Summaries or TL;DRs. |
| `example` | Code or usage examples. |

**Collapsible Callouts**:
For detailed examples, long lists, or secondary info, use `::: [!type]- Title` (note the minus sign) to default to collapsed.

#### Code Blocks
- Always specify the language (e.g., ` ```python `).
- For code blocks longer than 10 lines, use the `fold` attribute:
  ` ```python fold="Function Implementation" `

### 4. Writing Style
- **Condense**: Do not translate word-for-word. Summarize the *intent* and *logic*.
- **Lists**: Prefer bullet points over long paragraphs.
- **No Fluff**: Remove introductions, "In this article...", "Conclusion", etc., unless they contain unique insights.
