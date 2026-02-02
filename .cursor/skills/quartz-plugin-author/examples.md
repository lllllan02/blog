# Quartz 插件示例（可复制骨架）

## 示例 1：最小 Transformer（textTransform）

适合做纯文本级别的预处理（例如格式化、替换、规范化），会在 remark 解析前运行。

```ts
import { QuartzTransformerPlugin } from "../types"

interface Options {
  enabled: boolean
}

const defaultOptions: Options = { enabled: true }

export const MyTextTransformer: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "MyTextTransformer",
    textTransform(_ctx, src) {
      if (!opts.enabled) return src
      return src.replaceAll("\t", "  ")
    },
  }
}
```

接入：
- 新建 `quartz/plugins/transformers/myTextTransformer.ts`
- 在 `quartz/plugins/transformers/index.ts` 里 `export { MyTextTransformer } from "./myTextTransformer"`
- 在 `quartz.config.ts` 的 `transformers: []` 里加 `Plugin.MyTextTransformer()`

## 示例 2：最小 Transformer（htmlPlugins + unist visit）

适合遍历并改写 HTML AST（hast），例如给标题加属性、重写链接等。

```ts
import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root } from "hast"

export const MyHtmlTransformer: QuartzTransformerPlugin = () => ({
  name: "MyHtmlTransformer",
  htmlPlugins() {
    return [
      () => (tree: Root) => {
        visit(tree, "element", (node: any) => {
          if (node.tagName === "h1") {
            node.properties = node.properties ?? {}
            node.properties["data-h1"] = "true"
          }
        })
      },
    ]
  },
})
```

## 示例 3：最小 Filter（基于 frontmatter 过滤）

```ts
import { QuartzFilterPlugin } from "../types"

export const RemovePrivate: QuartzFilterPlugin = () => ({
  name: "RemovePrivate",
  shouldPublish(_ctx, [_tree, vfile]) {
    return vfile.data?.frontmatter?.private !== true
  },
})
```

## 示例 4：最小 Emitter（为每个页面额外写一个 JSON）

适合新增额外产物（例如调试用索引、搜索数据、站点地图的自定义版本等）。

```ts
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"

export const ExtraJson: QuartzEmitterPlugin = () => ({
  name: "ExtraJson",
  async emit(ctx, content) {
    const outputs = []
    for (const [_tree, file] of content) {
      const slug = file.data.slug!
      outputs.push(
        await write({
          ctx,
          slug: `${slug}/extra`,
          ext: ".json",
          content: JSON.stringify(
            { slug, title: file.data.frontmatter?.title ?? null },
            null,
            2,
          ),
        }),
      )
    }
    return outputs
  },
})
```

## 示例 5：Emitter 增量输出（partialEmit 只重建变更文件）

```ts
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"

export const ExtraJsonIncremental: QuartzEmitterPlugin = () => ({
  name: "ExtraJsonIncremental",
  async *emit(ctx, content) {
    for (const [_tree, file] of content) {
      yield write({
        ctx,
        slug: `${file.data.slug!}/extra`,
        ext: ".json",
        content: JSON.stringify({ slug: file.data.slug! }),
      })
    }
  },
  async *partialEmit(ctx, content, _resources, changeEvents) {
    const changed = new Set<string>()
    for (const e of changeEvents) {
      if (!e.file) continue
      if (e.type === "add" || e.type === "change") changed.add(e.file.data.slug!)
    }

    for (const [_tree, file] of content) {
      const slug = file.data.slug!
      if (!changed.has(slug)) continue
      yield write({
        ctx,
        slug: `${slug}/extra`,
        ext: ".json",
        content: JSON.stringify({ slug }),
      })
    }
  },
})
```
