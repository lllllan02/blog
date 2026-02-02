---
name: quartz-plugin-author
description: 编写、集成并验证本仓库 Quartz 插件（transformer / filter / emitter）。当用户需要新增站点构建能力、改写 Markdown/HTML 处理、调整发布过滤或添加新的生成产物时使用。
---

# Quartz Plugin Author

## Instructions

你在这个仓库里编写的是 Quartz 4 的插件，插件分三类：`transformer`（文本/Markdown AST/HTML AST 变换）、`filter`（决定是否发布某文件）、`emitter`（把内容写出为静态文件）。

按下面流程完成实现与接入；除非用户明确要求，否则不要引入新依赖。

## 工作流

### 1) 先判定插件类型（按目标选最小改动面）
- **Transformer**：需要改写 Markdown/HTML、增加/改写 `vfile.data`、注入页面资源（JS/CSS/head）。
- **Filter**：需要基于 `frontmatter` 或 `vfile.data` 决定是否发布。
- **Emitter**：需要新增/修改输出文件（HTML、RSS、sitemap、静态资源等），或优化增量构建（`partialEmit`）。

### 2) 确定落点与命名
- **文件位置**：
  - transformer：`quartz/plugins/transformers/<plugin>.ts`
  - filter：`quartz/plugins/filters/<plugin>.ts`
  - emitter：`quartz/plugins/emitters/<plugin>.ts` 或 `.tsx`（需要 JSX/组件渲染时）
- **导出命名**：
  - 统一导出 `export const <PluginName>: Quartz*Plugin<...> = (userOpts) => ({ ... })`
  - `name` 字段用稳定的字符串（用于日志与调试），避免随意变更
- **Options 约定**：
  - 定义 `interface Options { ... }` + `const defaultOptions: Options = { ... }`
  - 导出函数类型用 `Quartz*Plugin<Partial<Options>>`，再把 `userOpts` merge 到 `defaultOptions`

### 3) 实现插件主体（遵循现有接口）
- **Transformer**：
  - 需要文本级处理：实现 `textTransform(ctx, src) => string`
  - 需要 remark 插件：实现 `markdownPlugins(ctx) => PluggableList`
  - 需要 rehype 插件：实现 `htmlPlugins(ctx) => PluggableList`
  - 需要资源注入：实现 `externalResources(ctx) => Partial<StaticResources>`
- **Filter**：
  - 实现 `shouldPublish(ctx, content) => boolean`
  - 优先读取 `vfile.data.frontmatter`（若依赖它，确保 `FrontMatter()` transformer 在配置里位于你之前/之后的正确位置）
- **Emitter**：
  - 实现 `emit(ctx, content, resources)`，返回 `Promise<FilePath[]>` 或 `AsyncGenerator<FilePath>`
  - 若需要增量：实现 `partialEmit(ctx, content, resources, changeEvents)`（只写出受影响的文件）
  - 若依赖页面组件：实现 `getQuartzComponents(ctx)`，帮助 Quartz 做资源裁剪优化

### 4) 接入导出与配置
- **导出**：
  - 把插件加入对应目录的 `index.ts`（例如 `quartz/plugins/transformers/index.ts`）中统一导出
- **启用**（仅当用户要求“在站点中生效”时）：
  - 在 `quartz.config.ts` 的 `plugins.transformers / filters / emitters` 里添加 `Plugin.<PluginName>(opts)`

### 5) 验证（至少跑一次）
- **类型/格式检查**：`npm run check`
- **单测**（若你改动或新增了测试相关逻辑）：`npm test`
- **本地预览**（验证效果与增量构建）：`npx quartz build --serve`

## 关键约定（避免踩坑）
- **vfile 扩展数据**：若你往 `file.data` 写新字段，在插件文件末尾用 `declare module "vfile"` 扩展 `DataMap`，并确保字段名不与现有冲突。
- **顺序敏感**：transformer 之间可能存在顺序依赖（例如先解析 frontmatter 再使用它）。若行为异常，优先检查 `quartz.config.ts` 中插件顺序。
- **资源注入入口**：`externalResources` 会被聚合进站点静态资源（详见 `quartz/plugins/index.ts` 的 `getStaticResourcesFromPlugins`）。

## Additional Resources
- 参考与接口速查见 [reference.md](reference.md)
- 可复制的最小骨架与“常见需求”示例见 [examples.md](examples.md)
