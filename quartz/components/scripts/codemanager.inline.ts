function setupCodeFold() {
  const folds = document.querySelectorAll(".code-fold")
  folds.forEach((fold) => {
    const header = fold.querySelector(".code-fold-header")
    if (header) {
      header.removeEventListener("click", toggleFold)
      header.addEventListener("click", toggleFold)
    }
  })
}

function toggleFold(this: HTMLElement) {
  const fold = this.parentElement
  if (fold) {
    fold.classList.toggle("open")
  }
}

document.addEventListener("nav", setupCodeFold)
window.addEventListener("resize", setupCodeFold)
