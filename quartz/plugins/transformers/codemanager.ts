import { QuartzTransformerPlugin } from "../types"
// @ts-ignore
import codeFoldScript from "../../components/scripts/codemanager.inline"
// @ts-ignore
import codeFoldStyle from "./codemanager.scss"

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

        const codeBlockMatch = line.match(/^(`{3,})([^\s`]+)?(?:[\t ]+(.+))?$/)
        if (codeBlockMatch) {
          const backticks = codeBlockMatch[1]
          const lang = codeBlockMatch[2] || ""
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
            
            result.push(`<div class="code-fold">`)
            result.push(`<div class="code-fold-header"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="code-fold-icon"><polyline points="9 18 15 12 9 6"></polyline></svg><span class="code-fold-title">${title}</span></div>`)
            result.push(`<div class="code-fold-content">`)
            result.push("\n" + backticks + lang + (cleanMeta ? " " + cleanMeta : ""))
            result.push(codeLines.join("\n"))
            result.push(lines[j] || backticks)
            result.push(`</div></div>`)
            
            i = j + 1
            continue
          } else {
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
        css: [{ content: codeFoldStyle, inline: true }],
        js: [{ script: codeFoldScript, loadTime: "afterDOMReady", contentType: "inline" }],
      }
    },
  }
}
