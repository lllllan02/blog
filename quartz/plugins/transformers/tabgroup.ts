import { QuartzTransformerPlugin } from "../types"
// @ts-ignore
import tabGroupScript from "../../components/scripts/tabgroup.inline"
// @ts-ignore
import tabGroupStyle from "./tabgroup.scss"

export const TabGroup: QuartzTransformerPlugin = () => {
  return {
    name: "TabGroup",
    textTransform(_ctx, src) {
      const lines = src.split("\n")
      const result: string[] = []
      
      let i = 0
      let inCodeBlock = false
      let codeBlockBackticks = ""

      while (i < lines.length) {
        const line = lines[i]

        // 处理代码块状态，避免在代码块内误触发
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

        // 处理 TabGroup (:::tabgroup 或 :::codegroup)
        const groupMatch = line.match(/^:::(?:tabgroup|codegroup|code-group)(?:[\t ]+(.+))?/)
        if (groupMatch && !inCodeBlock) {
          let j = i + 1
          const tabs: { title: string; content: string[] }[] = []
          let currentTab: { title: string; content: string[] } | null = null

          while (j < lines.length && lines[j].trim() !== ":::") {
            const currentLine = lines[j]
            const tabMatch = currentLine.match(/^===[ \t]+(.+)/)
            
            if (tabMatch) {
              currentTab = { title: tabMatch[1].trim(), content: [] }
              tabs.push(currentTab)
            } else if (currentTab) {
              currentTab.content.push(currentLine)
            } else {
              currentTab = { title: "Tab 1", content: [currentLine] }
              tabs.push(currentTab)
            }
            j++
          }

          if (tabs.length > 0) {
            const tabButtons = tabs
              .map((tab, idx) => `<button class="tab-button${idx === 0 ? " active" : ""}" data-tab="${idx}">${tab.title}</button>`)
              .join("")
            const tabContents = tabs
              .map((tab, idx) => {
                const contentStr = tab.content.join("\n").trim()
                // 判断内容是否仅包含一个代码块
                const isCodeOnly =
                  contentStr.startsWith("```") &&
                  contentStr.endsWith("```") &&
                  (contentStr.match(/^```/gm) || []).length === 2
                // 判断内容是否以代码块结尾
                const endsWithCode = contentStr.endsWith("```")

                let className = "tab-content"
                if (idx === 0) className += " active"
                if (isCodeOnly) className += " code-only"
                else if (endsWithCode) className += " code-ends"

                return `<div class="${className}" data-tab="${idx}">\n\n${tab.content.join("\n")}\n\n</div>`
              })
              .join("\n")
            
            const groupHtml = `<div class="tab-group">\n<div class="tab-group-header">${tabButtons}</div>\n<div class="tab-group-content">\n${tabContents}\n</div>\n</div>`
            result.push(groupHtml)
          } else {
            result.push(line)
          }
          
          i = j + 1
          continue
        }

        result.push(line)
        i++
      }

      return result.join("\n")
    },
    externalResources() {
      return {
        css: [{ content: tabGroupStyle, inline: true }],
        js: [{ script: tabGroupScript, loadTime: "afterDOMReady", contentType: "inline" }],
      }
    },
  }
}
