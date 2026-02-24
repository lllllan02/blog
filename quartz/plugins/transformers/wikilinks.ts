import { QuartzTransformerPlugin } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { QuartzPluginData } from "../vfile"
import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Options {
  /** 存放 wiki 文档的目录名称，默认为 "wiki" */
  wikiDir: string
}

const defaultOptions: Options = {
  wikiDir: "wiki",
}

// 在 worker 线程中缓存关键词映射
let cachedKeywords: { keyword: string, slug: FullSlug }[] | null = null

function getWikiKeywords(contentDir: string, wikiDir: string): { keyword: string, slug: FullSlug }[] {
  if (cachedKeywords) return cachedKeywords

  const keywordsToSlugs: { keyword: string, slug: FullSlug }[] = []
  const wikiPath = path.join(contentDir, wikiDir)

  if (!fs.existsSync(wikiPath)) return []

  const files = fs.readdirSync(wikiPath).filter(f => f.endsWith(".md"))

  for (const file of files) {
    const filePath = path.join(wikiPath, file)
    const fileContent = fs.readFileSync(filePath, "utf-8")
    const { data } = matter(fileContent)
    
    const slug = (wikiDir + "/" + file.replace(/\.md$/, "")) as FullSlug
    const keywords: string[] = []

    // 仅依据 wiki 属性获取关键词
    if (data.wiki) {
      if (Array.isArray(data.wiki)) {
        keywords.push(...data.wiki)
      } else {
        keywords.push(String(data.wiki))
      }
    }

    for (const kw of keywords) {
      if (kw.length > 0) {
        keywordsToSlugs.push({ keyword: kw, slug })
      }
    }
  }

  // 按长度降序排序，确保长词优先匹配
  keywordsToSlugs.sort((a, b) => b.keyword.length - a.keyword.length)
  cachedKeywords = keywordsToSlugs
  return cachedKeywords
}

export const WikiLinks: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "WikiLinks",
    htmlPlugins(ctx) {
      return [
        () => {
          return (tree: any, file) => {
            const currentSlug = file.data.slug as FullSlug
            if (!currentSlug) return

            const keywordsToSlugs = getWikiKeywords(ctx.argv.directory, opts.wikiDir)
            if (keywordsToSlugs.length === 0) return

            const escapedKeywords = keywordsToSlugs.map(k => k.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            const regex = new RegExp(`(${escapedKeywords.join("|")})`, "g")

            function processNode(node: any) {
              if (!node || !node.children) return
              if (["a", "pre", "code", "kbd", "script", "style"].includes(node.tagName)) return

              for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i]
                
                if (child.type === "element") {
                  processNode(child)
                  continue
                }

                if (child.type !== "text") continue

                const text = child.value
                if (!text || text.trim().length === 0) continue

                let lastIndex = 0
                const newChildren: any[] = []

                let match
                regex.lastIndex = 0
                
                while ((match = regex.exec(text)) !== null) {
                  const matchedText = match[0]
                  const matchIndex = match.index
                  
                  const kwInfo = keywordsToSlugs.find(k => k.keyword === matchedText)
                  if (!kwInfo || kwInfo.slug === currentSlug) continue

                  const prevChar = text[matchIndex - 1]
                  const nextChar = text[matchIndex + matchedText.length]
                  
                  const isPureEnglish = /^[a-zA-Z0-9_-]+$/.test(matchedText)
                  if (isPureEnglish) {
                    const isPrevBoundary = !prevChar || !/\w/.test(prevChar)
                    const isNextBoundary = !nextChar || !/\w/.test(nextChar)
                    if (!isPrevBoundary || !isNextBoundary) continue
                  }

                  if (matchIndex > lastIndex) {
                    newChildren.push({ type: "text", value: text.slice(lastIndex, matchIndex) })
                  }

                  newChildren.push({
                    type: "element",
                    tagName: "a",
                    properties: {
                      href: resolveRelative(currentSlug, kwInfo.slug),
                      className: ["internal", "wiki-link"],
                      "data-slug": kwInfo.slug,
                    },
                    children: [{ type: "text", value: matchedText }]
                  })

                  lastIndex = matchIndex + matchedText.length
                }

                if (newChildren.length > 0) {
                  if (lastIndex < text.length) {
                    newChildren.push({ type: "text", value: text.slice(lastIndex) })
                  }
                  
                  node.children.splice(i, 1, ...newChildren)
                  i += newChildren.length - 1
                }
              }
            }

            processNode(tree)
          }
        },
      ]
    },
  }
}
