import { QuartzTransformerPlugin } from "../types"
// @ts-ignore
import codeManagerScript from "../../components/scripts/codemanager.inline"
// @ts-ignore
import codeManagerStyle from "./codemanager.scss"

export const CodeManager: QuartzTransformerPlugin = () => {
  return {
    name: "CodeManager",
    textTransform(_ctx, src) {
      const lines = src.split("\n")
      const result: string[] = []
      
      let i = 0
      let inCodeBlock = false
      let codeBlockBackticks = ""

      while (i < lines.length) {
        const line = lines[i]

        // 1. 处理 CodeGroup (:::codegroup)
        const groupMatch = line.match(/^:::(?:codegroup|code-group)(?:[\t ]+(.+))?/)
        if (groupMatch && !inCodeBlock) {
          const groupMeta = groupMatch[1] || ""
          let j = i + 1
          const groupLines: string[] = []
          while (j < lines.length && lines[j].trim() !== ":::") {
            groupLines.push(lines[j])
            j++
          }
          
          const content = groupLines.join("\n")
          const tabs: { title: string; html: string }[] = []
          const codeBlockRegex = /^(`{3,})(\S+)?(?:[\t ]+(.+))?\n([\s\S]*?)\n\1/gm
          let m: RegExpExecArray | null
          
          while ((m = codeBlockRegex.exec(content)) !== null) {
            const backticks = m[1]
            const lang = m[2] || ""
            const meta = m[3] || ""
            const code = m[4]
            
            // 提取标题：优先使用 title="xxx"，其次是 fold="xxx"，再次是 meta，最后是语言名
            const foldTitleMatch = meta.match(/fold="([^"]+)"/)
            const customTitleMatch = meta.match(/title="([^"]+)"/)
            const title = customTitleMatch ? customTitleMatch[1] : (foldTitleMatch ? foldTitleMatch[1] : (meta.replace(/fold(="[^"]*")?/, "").trim() || lang || "Code"))
            
            // 关键修复：移除 meta 中的 title 和 fold 关键字
            const cleanMeta = meta
              .replace(/title="[^"]*"/, "")
              .replace(/fold(="[^"]*")?/, "")
              .trim()
            
            // 代码组内部不再支持折叠，直接生成普通代码块
            const html = `${backticks}${lang}${cleanMeta ? " " + cleanMeta : ""}\n${code}\n${backticks}`
            tabs.push({ title, html: html.replace(/`/g, "\\`") })
          }

          if (tabs.length > 0) {
            const tabButtons = tabs
              .map((tab, idx) => `<button class="code-manager-tab-button${idx === 0 ? " active" : ""}" data-tab="${idx}">${tab.title}</button>`)
              .join("")
            const tabContents = tabs
              .map((tab, idx) => `<div class="code-manager-tab-content${idx === 0 ? " active" : ""}" data-tab="${idx}">\n\n${tabs[idx].html.replace(/\\`/g, "`")}\n\n</div>`)
              .join("\n")
            
            let groupHtml = `<div class="code-manager-group">\n<div class="code-manager-group-header">${tabButtons}</div>\n<div class="code-manager-group-content">\n${tabContents}\n</div>\n</div>`
            
            if (groupMeta.includes("fold")) {
              const groupTitleMatch = groupMeta.match(/fold="([^"]+)"/)
              const groupTitle = groupTitleMatch ? groupTitleMatch[1] : "Code Group"
              groupHtml = `<div class="code-manager-fold">\n<div class="code-manager-fold-header"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="code-manager-icon"><polyline points="9 18 15 12 9 6"></polyline></svg><span class="code-manager-fold-title">${groupTitle}</span></div>\n<div class="code-manager-fold-content">\n${groupHtml}\n</div>\n</div>`
            }
            
            result.push(groupHtml)
          } else {
            result.push(line + "\n" + content + "\n:::")
          }
          
          i = j + 1
          continue
        }

        // 2. 处理普通代码块折叠
        const codeBlockMatch = line.match(/^(`{3,})([^\s`]+)?(?:[\t ]+(.+))?$/)
        if (codeBlockMatch) {
          const backticks = codeBlockMatch[1]
          const meta = codeBlockMatch[3] || ""
          
          if (!inCodeBlock && meta.includes("fold")) {
            let j = i + 1
            const codeLines: string[] = []
            while (j < lines.length) {
              if (lines[j].startsWith(backticks) && lines[j].trim() === backticks) {
                break
              }
              codeLines.push(lines[j])
              j++
            }
            
            const titleMatch = meta.match(/fold="([^"]+)"/)
            const title = titleMatch ? titleMatch[1] : "Code"
            const cleanMeta = meta.replace(/fold(="[^"]*")?/, "").trim()
            
            result.push(`<div class="code-manager-fold">`)
            result.push(`<div class="code-manager-fold-header"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="code-manager-icon"><polyline points="9 18 15 12 9 6"></polyline></svg><span class="code-manager-fold-title">${title}</span></div>`)
            result.push(`<div class="code-manager-fold-content">`)
            result.push("\n" + backticks + (codeBlockMatch[2] || "") + (cleanMeta ? " " + cleanMeta : ""))
            result.push(codeLines.join("\n"))
            result.push(lines[j] || backticks)
            result.push(`</div></div>`)
            
            i = j + 1
            continue
          } else {
            // 状态跟踪：进入或退出普通代码块
            if (!inCodeBlock) {
              inCodeBlock = true
              codeBlockBackticks = backticks
            } else if (backticks === codeBlockBackticks) {
              inCodeBlock = false
            }
          }
        }

        result.push(line)
        i++
      }

      return result.join("\n")
    },
    externalResources() {
      return {
        css: [{ content: codeManagerStyle, inline: true }],
        js: [{ script: codeManagerScript, loadTime: "afterDOMReady", contentType: "inline" }],
      }
    },
  }
}
