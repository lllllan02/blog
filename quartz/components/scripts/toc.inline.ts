function escapeAttrValue(value: string) {
  // For selectors like a[data-for="..."], we only need to escape quotes/backslashes/newlines.
  // (github-slugger output is usually safe, but this keeps it robust.)
  return value.replace(/["\\\n\r\f]/g, "\\$&")
}

function getDepth(li: Element): number {
  for (const cls of Array.from(li.classList)) {
    if (cls.startsWith("depth-")) {
      const n = Number(cls.slice("depth-".length))
      return Number.isFinite(n) ? n : 0
    }
  }
  return 0
}

let currentActiveSlug: string | undefined
const visibleHeaders = new Map<string, number>()
let observedHeaders: HTMLElement[] = []

function updateTocProgress(toc: Element, activeSlug?: string) {
  const content = toc.querySelector(".toc-content") as HTMLElement | null
  if (!content) return

  const links = Array.from(content.querySelectorAll("a[data-for]")) as HTMLElement[]
  if (links.length === 0) return

  // "progress" is derived from current location: everything before (and including) the active heading is marked.
  let activeIndex = -1
  if (activeSlug) {
    for (let i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-for") === activeSlug) {
        activeIndex = i
        break
      }
    }
  }

  for (let i = 0; i < links.length; i++) {
    links[i].classList.toggle("passed", activeIndex >= 0 && i <= activeIndex)
  }
}

function updateTocVisibility(toc: Element, activeSlug?: string, visibleSlugs?: string[]) {
  const content = toc.querySelector(".toc-content") as HTMLElement | null
  if (!content) return

  const items = Array.from(content.querySelectorAll("li"))
  if (items.length === 0) return

  const depths = items.map((li) => getDepth(li))
  const slugs = items.map((li) => {
    const a = li.querySelector("a[data-for]") as HTMLElement | null
    return a?.getAttribute("data-for") ?? ""
  })

  const slugToIndex = new Map<string, number>()
  for (let i = 0; i < slugs.length; i++) {
    const s = slugs[i]
    if (s) slugToIndex.set(s, i)
  }

  const parent0: number[] = new Array(items.length).fill(-1)
  const parent1: number[] = new Array(items.length).fill(-1)
  const parent2: number[] = new Array(items.length).fill(-1)

  let p0 = -1
  let p1 = -1
  let p2 = -1
  for (let i = 0; i < items.length; i++) {
    const d = depths[i]
    if (d === 0) {
      p0 = i
      p1 = -1
      p2 = -1
    } else if (d === 1) {
      p1 = i
      p2 = -1
    } else if (d === 2) {
      p2 = i
    }

    parent0[i] = p0
    parent1[i] = p1
    parent2[i] = p2
  }

  const expanded0 = new Set<number>()
  const expanded1 = new Set<number>()
  const expanded2 = new Set<number>()

  const addAncestors = (idx: number) => {
    const a0 = parent0[idx]
    const a1 = parent1[idx]
    const a2 = parent2[idx]
    if (a0 >= 0) expanded0.add(a0)
    if (a1 >= 0) expanded1.add(a1)
    if (a2 >= 0) expanded2.add(a2)
  }

  for (const s of visibleSlugs ?? []) {
    const idx = slugToIndex.get(s)
    if (idx !== undefined) addAncestors(idx)
  }

  if (activeSlug) {
    const activeIdx = slugToIndex.get(activeSlug)
    if (activeIdx !== undefined) addAncestors(activeIdx)
  }

  // Default: only show the top-level entries (depth-0)
  if (expanded0.size === 0) {
    for (const li of items) {
      li.classList.toggle("toc-hidden", getDepth(li) > 0)
    }
    return
  }

  // Show rules:
  // - depth-0: always show
  // - depth-1: show only for currently visible top-level sections
  // - depth-2: show only under depth-1 branches that are currently in view (or contain the active heading)
  // - depth-3: show only under depth-2 branches that are currently in view (or contain the active heading)
  for (let i = 0; i < items.length; i++) {
    const li = items[i]
    const d = depths[i]
    const a0 = parent0[i]
    const a1 = parent1[i]
    const a2 = parent2[i]

    let show = false
    if (d === 0) {
      show = true
    } else if (a0 >= 0 && expanded0.has(a0)) {
      if (d === 1) show = true
      else if (d === 2) show = a1 >= 0 && expanded1.has(a1)
      else if (d === 3) show = a2 >= 0 && expanded2.has(a2)
    }

    li.classList.toggle("toc-hidden", !show)
  }
}

function updateAllTocs(activeSlug?: string) {
  const visibleSlugs = Array.from(visibleHeaders.keys())
  for (const toc of Array.from(document.getElementsByClassName("toc"))) {
    updateTocVisibility(toc, activeSlug, visibleSlugs)
    updateTocProgress(toc, activeSlug)
  }
}

function setActiveSlug(next?: string) {
  if (!next || next === currentActiveSlug) return
  currentActiveSlug = next
}

function computeActiveSlugFromHeaders(headers: HTMLElement[]) {
  // Prefer the heading closest to the top of the viewport (slightly above is ok),
  // otherwise fall back to the first heading below the top.
  const TOP_EPS = 120
  let bestAboveSlug: string | undefined
  let bestAboveTop = -Infinity
  let bestBelowSlug: string | undefined
  let bestBelowTop = Infinity

  for (const header of headers) {
    const top = header.getBoundingClientRect().top
    const slug = header.id
    if (!slug) continue

    if (top <= TOP_EPS && top > bestAboveTop) {
      bestAboveTop = top
      bestAboveSlug = slug
    }
    if (top > TOP_EPS && top < bestBelowTop) {
      bestBelowTop = top
      bestBelowSlug = slug
    }
  }

  return bestAboveSlug ?? bestBelowSlug
}

function updateActiveFromVisible() {
  // Normal path: pick from headings currently intersecting viewport
  if (visibleHeaders.size > 0) {
    const TOP_EPS = 120
    let bestAboveSlug: string | undefined
    let bestAboveTop = -Infinity
    let bestBelowSlug: string | undefined
    let bestBelowTop = Infinity

    for (const [slug, top] of visibleHeaders) {
      if (top <= TOP_EPS && top > bestAboveTop) {
        bestAboveTop = top
        bestAboveSlug = slug
      }
      if (top > TOP_EPS && top < bestBelowTop) {
        bestBelowTop = top
        bestBelowSlug = slug
      }
    }

    setActiveSlug(bestAboveSlug ?? bestBelowSlug)
    return
  }

  // Fallback: when no headings are visible (long text between headings),
  // derive active heading from DOM positions so the ToC doesn't collapse.
  setActiveSlug(computeActiveSlugFromHeaders(observedHeaders))
}

let observer: IntersectionObserver | undefined

function setupHeaderObserver() {
  observer?.disconnect()
  visibleHeaders.clear()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const slug = (entry.target as HTMLElement).id
        const tocEntryElements = document.querySelectorAll(
          `a[data-for="${escapeAttrValue(slug)}"]`,
        )

        tocEntryElements.forEach((el) => {
          el.classList.toggle("in-view", entry.isIntersecting)
        })

        if (entry.isIntersecting) {
          visibleHeaders.set(slug, entry.boundingClientRect.top)
        } else {
          visibleHeaders.delete(slug)
        }
      }
      // Compute active heading and update fold/progress once.
      updateActiveFromVisible()
      updateAllTocs(currentActiveSlug)
    },
    // Track headings visible in the viewport (for expansion); active heading is derived from their positions.
    { rootMargin: "0px 0px 0px 0px", threshold: 0 },
  )

  // Keep this in sync with ToC maxDepth (currently 4): only observe headings we can show in the ToC.
  observedHeaders = Array.from(document.querySelectorAll("h1[id], h2[id], h3[id], h4[id]"))
  observedHeaders.forEach((header) => observer?.observe(header))
}

function toggleToc(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as HTMLElement | undefined
  if (!content) return
  content.classList.toggle("collapsed")
  // Re-apply folded view when expanding/collapsing
  updateAllTocs(currentActiveSlug)
}

function setupToc() {
  for (const toc of document.getElementsByClassName("toc")) {
    const button = toc.querySelector(".toc-header")
    const content = toc.querySelector(".toc-content")
    if (!button || !content) return
    button.addEventListener("click", toggleToc)
    window.addCleanup(() => button.removeEventListener("click", toggleToc))
  }
}

document.addEventListener("nav", () => {
  setupToc()

  // Initialize default visibility (only depth-0), then expand based on current location/hash as we scroll
  const hash = typeof location !== "undefined" ? location.hash.replace(/^#/, "") : ""
  currentActiveSlug = hash ? decodeURIComponent(hash) : undefined
  setupHeaderObserver()

  // If we land in the middle of a long section with no visible headings,
  // compute active slug from scroll position so the ToC stays expanded correctly.
  if (!currentActiveSlug) {
    currentActiveSlug = computeActiveSlugFromHeaders(observedHeaders)
  }
  updateAllTocs(currentActiveSlug)
})
