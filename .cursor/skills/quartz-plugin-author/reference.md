# Quartz 插件开发速查（本仓库）

本仓库 Quartz 插件在 `quartz/plugins/` 下分为三类：
- `transformers/`：文本/Markdown AST/HTML AST 变换
- `filters/`：决定是否发布某文件
- `emitters/`：把内容写出为静态文件（HTML/资源/索引等）

## 1) 插件类型签名（应当遵循）

### Transformer（变换链）
- **入口**：`quartz/processors/parse.ts`
  - `textTransform` 在 parse 早期对原始 Markdown 文本执行（逐文件）
  - `markdownPlugins` 会被挂到 `unified().use(...)` 的 remark 处理链
  - `htmlPlugins` 会被挂到 `remarkRehype` 之后的 rehype 处理链

### Filter（发布判断）
- **入口**：`quartz/processors/filter.ts`（Quartz 内部会对 `ProcessedContent` 调用 `shouldPublish`）
- **典型读取**：`vfile.data.frontmatter`（需要 `FrontMatter()` transformer 已启用且顺序正确）

### Emitter（输出写文件）
- **入口**：`quartz/processors/emit.ts`
- **增量构建**：`partialEmit` 会在本地 serve 时基于 `changeEvents` 只重建受影响输出

## 2) 文件与导出约定

### 放置路径
- transformer：`quartz/plugins/transformers/<plugin>.ts`
- filter：`quartz/plugins/filters/<plugin>.ts`
- emitter：`quartz/plugins/emitters/<plugin>.ts`（或 `.tsx`）

### 导出与聚合
- 每个目录都有一个 `index.ts`（例如 `quartz/plugins/transformers/index.ts`）统一导出
- 总入口 `quartz/plugins/index.ts` 会 `export * from "./transformers" | "./filters" | "./emitters"`

因此：**新增插件时通常需要更新“同目录的 `index.ts`”**，然后就可以在 `quartz.config.ts` 里通过 `import * as Plugin from "./quartz/plugins"` 直接使用。

## 3) externalResources（注入 JS/CSS/head）

`transformer` 与 `emitter` 都允许实现：
- `externalResources?: (ctx) => Partial<StaticResources> | undefined`

聚合逻辑见 `quartz/plugins/index.ts` 的 `getStaticResourcesFromPlugins`：
- 会收集 `.js / .css / .additionalHead`
- 本地 `--serve` 时会额外注入热重载 websocket 脚本

## 4) vfile.data 扩展（强烈建议做类型声明）

插件往 `file.data` 写字段时，建议在插件文件末尾加入：
- `declare module "vfile" { interface DataMap { ... } }`

这样后续组件/插件读取 `file.data.<field>` 会有 TS 类型提示，也避免字段名误拼写。

## 5) 常用验证命令

- 类型检查 + Prettier：`npm run check`
- 测试：`npm test`
- 本地预览：
  - `npm run quartz -- build --serve`
  - 或 `npx quartz build --serve`

## 6) 何时选哪类插件（决策表）

- **只想改输出 HTML 结构**：优先改组件（`quartz/components/`）或 emitter（`ContentPage` 之类）
- **想改 Markdown 语法/渲染结果**：transformer（remark/rehype）
- **想基于元数据“禁发/过滤”**：filter（`RemoveDrafts` 模式）
- **想新增一种产物（如额外 JSON 索引）**：emitter（支持 `partialEmit`）
