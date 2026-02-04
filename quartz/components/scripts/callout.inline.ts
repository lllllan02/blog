function syncCalloutContentGridRows() {
  const collapsible = document.getElementsByClassName(
    "callout is-collapsible",
  ) as HTMLCollectionOf<HTMLElement>

  for (const callout of collapsible) {
    const content = callout.getElementsByClassName("callout-content")[0] as HTMLElement | undefined
    if (!content) continue
    const collapsed = callout.classList.contains("is-collapsed")
    content.style.gridTemplateRows = collapsed ? "0fr" : "1fr"

    const title = callout.getElementsByClassName("callout-title")[0] as HTMLElement | undefined
    if (title) title.setAttribute("aria-expanded", collapsed ? "false" : "true")
  }
}

function onCalloutTitleClick(evt: MouseEvent) {
  const target = evt.target
  if (!(target instanceof Element)) return

  // 允许标题里的链接正常跳转
  if (target.closest("a")) return

  const title = target.closest(".callout.is-collapsible > .callout-title") as HTMLElement | null
  if (!title) return

  const callout = title.closest(".callout") as HTMLElement | null
  if (!callout) return

  callout.classList.toggle("is-collapsed")

  const content = callout.getElementsByClassName("callout-content")[0] as HTMLElement | undefined
  if (!content) return

  const collapsed = callout.classList.contains("is-collapsed")
  content.style.gridTemplateRows = collapsed ? "0fr" : "1fr"
  title.setAttribute("aria-expanded", collapsed ? "false" : "true")
}

// 该脚本会被多个 transformer 注入（例如 OFM + Callout）。
// 若不做全局去重，会重复绑定 click 监听器，导致一次点击触发两次 toggle，
// 最终视觉上表现为“默认折叠无法展开/展开又立刻折回”。
const w = window as any
if (!w.__quartzCalloutScriptInitialized) {
  w.__quartzCalloutScriptInitialized = true

  document.addEventListener("click", onCalloutTitleClick)
  document.addEventListener("nav", syncCalloutContentGridRows)

  // `nav` 事件在某些情况下不会覆盖首次渲染；确保首次加载也能正确设置初始状态
  syncCalloutContentGridRows()
}
