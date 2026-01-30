function setupCodeGroups() {
  const codeGroups = document.querySelectorAll(".code-group")

  codeGroups.forEach((group) => {
    const buttons = group.querySelectorAll(".tab-button")
    const contents = group.querySelectorAll(".tab-content")

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabIndex = (button as HTMLElement).dataset.tab

        // Remove active class from all buttons and contents in this group
        buttons.forEach((btn) => btn.classList.remove("active"))
        contents.forEach((content) => content.classList.remove("active"))

        // Add active class to clicked button and corresponding content
        button.classList.add("active")
        group.querySelector(`.tab-content[data-tab="${tabIndex}"]`)?.classList.add("active")
      })
    })
  })
}

document.addEventListener("nav", setupCodeGroups)
window.addEventListener("resize", setupCodeGroups)
