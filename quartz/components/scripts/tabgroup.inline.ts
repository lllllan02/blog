function setupTabGroup() {
  const groups = document.querySelectorAll(".tab-group")
  groups.forEach((group) => {
    const buttons = group.querySelectorAll(".tab-button")
    const contents = group.querySelectorAll(".tab-content")

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabIndex = (button as HTMLElement).dataset.tab
        buttons.forEach((btn) => btn.classList.remove("active"))
        contents.forEach((content) => content.classList.remove("active"))
        button.classList.add("active")
        group.querySelector(`.tab-content[data-tab="${tabIndex}"]`)?.classList.add("active")
      })
    })
  })
}

document.addEventListener("nav", setupTabGroup)
window.addEventListener("resize", setupTabGroup)
