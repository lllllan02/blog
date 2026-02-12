const initScrollProgress = () => {
  const bar = document.getElementById("scroll-progress-bar")
  if (!bar) return

  const updateProgress = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    const scrollable = scrollHeight - clientHeight
    const progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0
    bar.style.width = `${Math.min(100, progress)}%`
  }

  window.addEventListener("scroll", updateProgress, { passive: true })
  updateProgress() // 初始状态

  return () => window.removeEventListener("scroll", updateProgress)
}

document.addEventListener("nav", () => {
  const cleanup = initScrollProgress()
  if (cleanup && window.addCleanup) {
    window.addCleanup(cleanup)
  }
})

// 首次加载时初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollProgress)
} else {
  initScrollProgress()
}
