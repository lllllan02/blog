import { QuartzTransformerPlugin } from "../types"
import { capitalize } from "../../util/lang"
// @ts-ignore
import calloutScript from "../../components/scripts/callout.inline"
// @ts-ignore
import calloutStyle from "./callout.scss"

export interface Options {
  renderDefaultTitles: boolean
}

const defaultOptions: Options = {
  renderDefaultTitles: true,
}

const calloutMapping: Record<string, string> = {
  note: "note", abstract: "abstract", summary: "abstract", tldr: "abstract",
  info: "info", todo: "todo", tip: "tip", hint: "tip", important: "tip",
  success: "success", check: "success", done: "success",
  question: "question", help: "question", faq: "question",
  warning: "warning", attention: "warning", caution: "warning",
  failure: "failure", missing: "failure", fail: "failure",
  danger: "danger", error: "danger", bug: "bug",
  example: "example", quote: "quote", cite: "quote",
}

function normalizeHex(color: string): string {
  let hex = color.trim().replace(/^#/, "")
  if (hex.length === 3) {
    hex = hex.split("").map(char => char + char).join("")
  }
  return hex.length === 6 ? `#${hex}` : color
}

export const Callout: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "Callout",
    textTransform(_ctx, src) {
      // 关键修复：
      // 1. 优先跳过代码块
      // 2. 调整结束标记匹配顺序：优先匹配紧随标题行的结束符 (?:[\n\r]\1)
      // 3. 这样可以防止正则表达式错误地吞噬后续内容
      const combinedRegex = /```[\s\S]*?```|^(:{3,})[\t ]*\[!([^\s|\]\[]+)(?:\|([^\]\n]*))?\]([+-])?[\t ]*(.*?)(?:[\n\r]\1|[\n\r]([\s\S]*?)[\n\r]\1)(?:\s|$)/gm
      
      const parseCallouts = (content: string): string => {
        return content.replace(combinedRegex, (match, _colons, type, metadata, collapse, title, body) => {
          if (match.startsWith("```")) return match

          let customIcon = ""
          let customColor = ""
          let calloutType = "note"

          const normalizedType = type.toLowerCase()
          if (normalizedType.startsWith("http") || normalizedType.startsWith("/")) {
            customIcon = type
            calloutType = "custom"
          } else {
            calloutType = calloutMapping[normalizedType] ?? normalizedType
          }

          if (metadata) {
            const parts = metadata.split("|")
            for (let part of parts) {
              part = part.trim()
              if (part.startsWith("#")) {
                customColor = normalizeHex(part)
              } else if (part.startsWith("icon:")) {
                customIcon = part.slice(5)
              } else if (part.startsWith("color:")) {
                customColor = normalizeHex(part.slice(6))
              } else if (part.startsWith("http") || part.startsWith("/")) {
                customIcon = part
              }
            }
          }

          const isCollapsible = collapse === "+" || collapse === "-"
          const isCollapsed = collapse === "-"
          const wikilinkRegex = /!?\[\[([^\[\]\|\#\\]+)?(#+[^\[\]\|\#\\]+)?(\\?\|[^\[\]\#]*)?\]\]/g
          const mdLinkRegex = /\[([^\[\]]+)\]\(([^()]+)\)/g
          const panguRegex1 = /([\u4e00-\u9fa5])([a-zA-Z0-9])/g
          const panguRegex2 = /([a-zA-Z0-9])([\u4e00-\u9fa5])/g
          const panguReplace = "$1 $2"
          const applyPangu = (text: string) => text.replace(panguRegex1, panguReplace).replace(panguRegex2, panguReplace)

          const displayTitle = (
            title?.trim() ||
            (opts.renderDefaultTitles ? capitalize(calloutType === "custom" ? "Note" : type) : "")
          )
            .replace(
              wikilinkRegex,
              (_match: string, fp: string | undefined, header: string | undefined, alias: string | undefined) => {
                const display = (alias ?? "").replace(/^\\?\|/, "") || fp || header || ""
                return applyPangu(display)
              },
            )
            .replace(mdLinkRegex, (_match: string, display: string, dest: string) => {
              return `<a href="${dest}">${applyPangu(display)}</a>`
            })
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/~~(.+?)~~/g, "<del>$1</del>")
            .replace(/==([^=]+)==/g, '<span class="text-highlight">$1</span>')
            .split(/(<[^>]+>)/)
            .map((part: string) => (part.startsWith("<") ? part : applyPangu(part)))
            .join("")
            .replace(/([\u4e00-\u9fa5])(<[^>]+>)([a-zA-Z0-9])/g, "$1 $2$3")
            .replace(/([a-zA-Z0-9])(<[^>]+>)([\u4e00-\u9fa5])/g, "$1 $2$3")
            .replace(/([a-zA-Z0-9])(<\/[^>]+>)([\u4e00-\u9fa5])/g, "$1$2 $3")
            .replace(/([\u4e00-\u9fa5])(<\/[^>]+>)([a-zA-Z0-9])/g, "$1$2 $3")
          const collapseIcon = isCollapsible ? `<div class="fold-callout-icon"></div>` : ""
          
          const classNames = ["callout", calloutType]
          if (isCollapsible) classNames.push("is-collapsible")
          if (isCollapsed) classNames.push("is-collapsed")
          
          const escapeHash = (str: string) => str.replace(/#/g, "&#x23;")
          const styleAttr = customColor ? `style="--color: ${escapeHash(customColor)}; --callout-color: ${escapeHash(customColor)}; --border: ${escapeHash(customColor)}44; --bg: ${escapeHash(customColor)}15; --callout-border: ${escapeHash(customColor)}44; --callout-bg: ${escapeHash(customColor)}15;"` : ""
          const iconBg = customColor ? `background-color: var(--callout-color);` : ""
          const iconAttr = customIcon ? `style="mask-image: url('${escapeHash(customIcon)}'); -webkit-mask-image: url('${escapeHash(customIcon)}'); ${iconBg}"` : ""

          // 递归处理内容
          const processedBody = body ? parseCallouts(body.trim()) : ""
          const contentHtml = processedBody 
            ? `<div class="callout-content"><div class="callout-content-inner">\n\n${processedBody}\n\n</div></div>`
            : ""

          return `\n<blockquote class="${classNames.join(" ")}" data-callout="${calloutType}" data-callout-fold="${isCollapsible}" ${styleAttr}><div class="callout-title"><div class="callout-icon" ${iconAttr}></div><div class="callout-title-inner">${displayTitle}</div>${collapseIcon}</div>${contentHtml}</blockquote>\n`
        })
      }
      return parseCallouts(src)
    },
    externalResources() {
      return {
        css: [{ content: calloutStyle, inline: true }],
        js: [{ script: calloutScript, loadTime: "afterDOMReady", contentType: "inline" }],
      }
    },
  }
}
