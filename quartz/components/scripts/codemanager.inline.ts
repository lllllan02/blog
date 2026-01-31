function setupCodeManager() {
  // 处理折叠
  const folds = document.querySelectorAll(".code-manager-fold")
  folds.forEach((fold) => {
    const header = fold.querySelector(".code-manager-fold-header")
    if (header) {
      header.removeEventListener("click", toggleFold)
      header.addEventListener("click", toggleFold)
    }
  })

  // 处理代码组
  const groups = document.querySelectorAll(".code-manager-group")
  groups.forEach((group) => {
    const buttons = group.querySelectorAll(".code-manager-tab-button")
    const contents = group.querySelectorAll(".code-manager-tab-content")

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabIndex = (button as HTMLElement).dataset.tab
        buttons.forEach((btn) => btn.classList.remove("active"))
        contents.forEach((content) => content.classList.remove("active"))
        button.classList.add("active")
        group.querySelector(`.code-manager-tab-content[data-tab="${tabIndex}"]`)?.classList.add("active")
      })
    })
  })
}

function toggleFold(this: HTMLElement) {
  const fold = this.parentElement
  if (fold) {
    fold.classList.toggle("open")
  }
}

document.addEventListener("nav", setupCodeManager)
window.addEventListener("resize", setupCodeManager)
