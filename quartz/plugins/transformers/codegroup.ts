import { QuartzTransformerPlugin } from "../types"
// @ts-ignore
import codegroupScript from "../../components/scripts/codegroup.inline"
// @ts-ignore
import codegroupStyle from "./codegroup.scss"

export const CodeGroup: QuartzTransformerPlugin = () => {
  return {
    name: "CodeGroup",
    textTransform(_ctx, src) {
      // 1. 优先处理代码块，避免干扰
      // 我们需要一个正则来匹配所有的代码块（包括嵌套的）
      // 这里的策略是：先找出所有的 :::codegroup 块，但要排除掉被更高级别代码块包裹的情况
      
      // 改进代码块匹配正则：
      // - 支持 3 个或更多反引号
      // - 能够正确处理内部也包含反引号的情况（通过非贪婪匹配和边界检查）
      const codeBlockRegex = /^(`{3,})(\S+)(?:[\t ]+(.+?))?\n([\s\S]*?)\n\1/gm

      // 辅助函数：解析 codegroup 内部的内容
      const parseContent = (content: string) => {
        const tabs: { title: string; html: string }[] = []
        let m: RegExpExecArray | null
        
        // 重置正则状态
        codeBlockRegex.lastIndex = 0
        
        while ((m = codeBlockRegex.exec(content)) !== null) {
          const backticks = m[1]
          const lang = m[2]
          const title = m[3] || lang
          const code = m[4]
          
          const html = `${backticks}${lang}\n${code}\n${backticks}`
          tabs.push({ title, html })
        }
        return tabs
      }

      // 处理逻辑：
      // 由于 textTransform 是对整个源文件运行的，我们需要确保不匹配到被包裹在代码块里的 :::codegroup
      // 一个简单的方法是按行处理，或者使用一个更复杂的正则来跳过代码块
      
      const lines = src.split("\n")
      const result: string[] = []
      let inCodeBlock = false
      let codeBlockBackticks = ""
      let inCodeGroup = false
      let currentGroupContent: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const codeBlockMatch = line.match(/^(`{3,})/)

        if (codeBlockMatch) {
          const backticks = codeBlockMatch[1]
          if (!inCodeBlock) {
            inCodeBlock = true
            codeBlockBackticks = backticks
          } else if (backticks === codeBlockBackticks) {
            inCodeBlock = false
          }
        }

        if (!inCodeBlock) {
          if (line.match(/^:::(?:codegroup|code-group)/)) {
            inCodeGroup = true
            currentGroupContent = []
            continue
          } else if (line.trim() === ":::" && inCodeGroup) {
            inCodeGroup = false
            const content = currentGroupContent.join("\n")
            const tabs = parseContent(content)

            if (tabs.length > 0) {
              const tabButtons = tabs
                .map((tab, i) => `<button class="tab-button${i === 0 ? " active" : ""}" data-tab="${i}">${tab.title}</button>`)
                .join("")
              
              const tabContents = tabs
                .map((tab, i) => `<div class="tab-content${i === 0 ? " active" : ""}" data-tab="${i}">\n\n${tab.html}\n\n</div>`)
                .join("\n")

              result.push(`<div class="code-group">\n<div class="code-group-header">${tabButtons}</div>\n<div class="code-group-content">\n${tabContents}\n</div>\n</div>`)
            } else {
              // 如果没解析出标签，还原内容
              result.push(":::codegroup\n" + content + "\n:::")
            }
            continue
          }
        }

        if (inCodeGroup) {
          currentGroupContent.push(line)
        } else {
          result.push(line)
        }
      }

      return result.join("\n")
    },
    externalResources() {
      return {
        css: [{ content: codegroupStyle, inline: true }],
        js: [{ script: codegroupScript, loadTime: "afterDOMReady", contentType: "inline" }],
      }
    },
  }
}
