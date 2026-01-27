import { QuartzTransformerPlugin } from "../types"
import { Root, Text } from "mdast"
import { findAndReplace as mdastFindReplace } from "mdast-util-find-and-replace"
import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"

export const Pangu: QuartzTransformerPlugin = () => {
  return {
    name: "Pangu",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            // 1. 处理节点内的中英文空格
            mdastFindReplace(tree, [
              [
                /([\u4e00-\u9fa5])([a-zA-Z0-9])/g,
                (_value: string, p1: string, p2: string) => `${p1} ${p2}`,
              ],
              [
                /([a-zA-Z0-9])([\u4e00-\u9fa5])/g,
                (_value: string, p1: string, p2: string) => `${p1} ${p2}`,
              ],
            ])

            // 2. 处理跨节点的中英文空格 (例如: [Link]中文)
            visit(tree, (node, index, parent: any) => {
              if (index === undefined || !parent) return

              const nextNode = parent.children[index + 1]
              if (!nextNode) return

              const currentText = toString(node)
              const nextText = toString(nextNode)

              if (currentText && nextText) {
                // 中文后跟英文
                if (/[\u4e00-\u9fa5]$/.test(currentText) && /^[a-zA-Z0-9]/.test(nextText)) {
                  if (node.type === "text") {
                    ;(node as Text).value += " "
                  } else if (nextNode.type === "text") {
                    ;(nextNode as Text).value = " " + (nextNode as Text).value
                  }
                }
                // 英文后跟中文
                else if (/[a-zA-Z0-9]$/.test(currentText) && /^[\u4e00-\u9fa5]/.test(nextText)) {
                  if (nextNode.type === "text") {
                    ;(nextNode as Text).value = " " + (nextNode as Text).value
                  } else if (node.type === "text") {
                    ;(node as Text).value += " "
                  }
                }
              }
            })
          }
        },
      ]
    },
  }
}
