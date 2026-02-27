document.addEventListener("nav", () => {
  const trigger = document.querySelector(".domain-trigger") as HTMLElement
  const menu = document.querySelector(".domain-menu") as HTMLElement
  
  if (!trigger || !menu) return

  const toggleMenu = (e: Event) => {
    e.stopPropagation()
    const isExpanded = trigger.getAttribute("aria-expanded") === "true"
    
    if (isExpanded) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  const openMenu = () => {
    trigger.setAttribute("aria-expanded", "true")
    menu.classList.add("show")
  }

  const closeMenu = () => {
    trigger.setAttribute("aria-expanded", "false")
    menu.classList.remove("show")
  }

  const handleClickOutside = (e: Event) => {
    if (!trigger.contains(e.target as Node) && !menu.contains(e.target as Node)) {
      closeMenu()
    }
  }

  trigger.addEventListener("click", toggleMenu)
  document.addEventListener("click", handleClickOutside)
  
  window.addCleanup(() => {
    trigger.removeEventListener("click", toggleMenu)
    document.removeEventListener("click", handleClickOutside)
  })
})
