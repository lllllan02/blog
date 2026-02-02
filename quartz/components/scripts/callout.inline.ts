function toggleCallout(this: HTMLElement, _evt?: MouseEvent) {
  const outerBlock = (this.closest(".callout") as HTMLElement | null) ?? this.parentElement
  if (!outerBlock) return
  outerBlock.classList.toggle("is-collapsed")
  const content = outerBlock.getElementsByClassName("callout-content")[0] as HTMLElement
  if (!content) return
  const collapsed = outerBlock.classList.contains("is-collapsed")
  content.style.gridTemplateRows = collapsed ? "0fr" : "1fr"
}

function setupCallout() {
  const collapsible = document.getElementsByClassName(
    `callout is-collapsible`,
  ) as HTMLCollectionOf<HTMLElement>
  for (const div of collapsible) {
    const title = div.getElementsByClassName("callout-title")[0] as HTMLElement
    const content = div.getElementsByClassName("callout-content")[0] as HTMLElement
    if (!title || !content) continue

    // make setup idempotent even if run multiple times
    title.removeEventListener("click", toggleCallout)
    title.addEventListener("click", toggleCallout)
    if (typeof window.addCleanup === "function") {
      window.addCleanup(() => title.removeEventListener("click", toggleCallout))
    }

    const collapsed = div.classList.contains("is-collapsed")
    content.style.gridTemplateRows = collapsed ? "0fr" : "1fr"
  }
}

document.addEventListener("nav", setupCallout)
// `nav` 事件在某些情况下不会覆盖首次渲染；确保首次加载也能绑定点击事件
setupCallout()
