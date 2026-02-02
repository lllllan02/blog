---
name: writing-style
description: 规范本项目 Markdown 文档的写作风格、元数据（UUID 别名/标签/日期）与排版。当需要新建或改写项目文档（尤其是 content 下的文章）时使用。
---

# Writing Style

## 适用范围与优先级

- **适用范围**：本项目内的 Markdown 文档（尤其是 `content/` 下的文章类内容）。
- **不适用/例外**：
  - **Agent Skills**（如 `.cursor/skills/**/SKILL.md`）：只遵循 Agent Skills 的 `name/description` 元数据格式，不强制使用本文的文章型 frontmatter 字段（`title/aliases/date/tags/...`）。
  - **代码文件**：以代码规范与可读性为先，本规范仅影响代码注释与 README/说明文档的写作。
- **冲突处理**：若用户对单篇文档提出更具体的格式/字段要求，以用户要求为最高优先级；否则以本规范为准。

## 工作流（生成/改写 Markdown 时照做）

1. **确认文档类型**
   - **文章/笔记类（常见于 `content/`）**：必须包含“文章型 frontmatter”。
   - **仓库说明类（如 `README.md`）**：可不使用文章型 frontmatter，但仍需遵循排版与链接规范。

2. **初始化元数据（仅文章/笔记类强制）**
   - **Frontmatter 字段**：必须包含并遵循 `reference.md` 中“标题与元数据规范”的权威字段清单与约束。
   - **实现建议**：生成 `aliases` 时使用 UUID v4（小写、带连字符），并确保全仓库唯一。

3. **组织结构（优先列表化，避免长段落）**
   - 优先使用 2-4 级标题拆分主题。
   - 主题内优先用无序/有序列表承载信息点。

4. **渐进式披露（可选策略：用 Callout 强化重点/收纳扩展）**
   - **适用场景**：重点结论、补充说明、注意事项、踩坑提示等，都可以尝试用 Callout 做“视觉强化”。
   - **默认折叠**：当内容过长、偏扩展、偏背景资料时，优先使用可折叠 Callout（如 `::: [!abstract]- 标题`）收纳，避免正文被打断。
   - **类型不设限**：不限于 `[!abstract]` / `[!tip]`，常用约定见 `reference.md`。
   - **原子化**：一个 Callout 只讲一个知识点，不要把多个点堆在一个 Callout 里。

5. **输出前自检**（见“自检清单”）

## 自检清单（提交/输出前必过）

- **标题**：所有标题（H1-H6）无 Emoji。
- **结构**：尽量列表化；重点/补充可用 Callout 强化；扩展/过长内容默认折叠；单个 Callout 只讲一个点。
- **元数据（文章/笔记类）**：字段齐全；`date` 为 `YYYY-MM-DD HH:mm:ss`；`aliases` 为唯一 UUID。
- **链接**：内部链接用 `[[aliases|title]]`（其中 `aliases` 为 UUID）；外链用 `[title](url)`。
- **标签**：优先来自 `.cursor/data/tags.txt`；新增标签已先更新库文件。
- **排版**：中英文间有空格；标题/段落间有空行；代码块带语言标签；长代码已折叠；多维内容已用 TabGroup。

## Additional Resources

- 详细规则与边界情况见 [reference.md](reference.md)。
- 可复制的模板/片段见 [examples.md](examples.md)。

## 开发者指令（对 Agent 的硬性要求）

当执行文档生成任务时：
1. **初始化元数据**：生成 UUID，并从标签库匹配标签。
2. **内容审核**：根据“文档简洁原则”过滤无关信息。
3. **格式自检**：检查标题是否有 Emoji，中英文是否有空格，空行是否充足。
