async function setupFlashcardSummary() {
  const STORAGE_KEY_KNOWN = "quartz-flashcards-known"
  const STORAGE_KEY_VIEWS = "quartz-flashcards-views"
  const STORAGE_KEY_MASTERED_COUNT = "quartz-flashcards-mastered-count"

  const knownSlugs: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_KNOWN) || "[]")
  const viewCounts: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_VIEWS) || "{}")
  const masteredCounts: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_MASTERED_COUNT) || "{}")

  const statsContainer = document.getElementById("summary-stats")
  if (statsContainer) {
    statsContainer.innerHTML = `Total Cards: ${document.querySelectorAll(".flashcard-list tbody tr").length} | Mastered: ${knownSlugs.length}`
  }

  const clearBtn = document.getElementById("clear-stats-btn")
  if (clearBtn) {
    let confirmTimeout: number | null = null
    const originalText = clearBtn.innerHTML

    clearBtn.addEventListener("click", () => {
      if (clearBtn.classList.contains("confirming")) {
        // Second click: perform action
        localStorage.removeItem(STORAGE_KEY_KNOWN)
        localStorage.removeItem(STORAGE_KEY_VIEWS)
        localStorage.removeItem(STORAGE_KEY_MASTERED_COUNT)
        window.location.reload()
      } else {
        // First click: enter confirmation state
        clearBtn.classList.add("confirming")
        clearBtn.innerHTML = "Are you sure?"
        
        if (confirmTimeout) clearTimeout(confirmTimeout)
        confirmTimeout = window.setTimeout(() => {
          clearBtn.classList.remove("confirming")
          clearBtn.innerHTML = originalText
        }, 3000)
      }
    })
  }

  document.querySelectorAll(".flashcard-list tbody tr").forEach((row) => {
    const slug = row.getAttribute("data-slug")
    if (!slug) return

    const viewCountCell = row.querySelector(".view-count")
    const masteredCountCell = row.querySelector(".mastered-count")
    const statusCell = row.querySelector(".status")

    if (viewCountCell) viewCountCell.textContent = (viewCounts[slug] || 0).toString()
    if (masteredCountCell) masteredCountCell.textContent = (masteredCounts[slug] || 0).toString()
    
    if (statusCell) {
      if (knownSlugs.includes(slug)) {
        statusCell.textContent = "Mastered"
        statusCell.classList.add("status-mastered")
      } else {
        statusCell.textContent = "Learning"
        statusCell.classList.add("status-learning")
      }
    }

    const singleClearBtn = row.querySelector(".clear-single-btn") as HTMLElement
    if (singleClearBtn) {
      let singleConfirmTimeout: number | null = null
      const originalIcon = singleClearBtn.innerHTML

      singleClearBtn.addEventListener("click", () => {
        if (singleClearBtn.classList.contains("confirming")) {
          // Second click: perform action
          const updatedKnown = knownSlugs.filter(s => s !== slug)
          localStorage.setItem(STORAGE_KEY_KNOWN, JSON.stringify(updatedKnown))
          delete viewCounts[slug]
          localStorage.setItem(STORAGE_KEY_VIEWS, JSON.stringify(viewCounts))
          delete masteredCounts[slug]
          localStorage.setItem(STORAGE_KEY_MASTERED_COUNT, JSON.stringify(masteredCounts))
          window.location.reload()
        } else {
          // First click: enter confirmation state
          singleClearBtn.classList.add("confirming")
          singleClearBtn.innerHTML = "Confirm?"
          singleClearBtn.style.fontSize = "10px"
          singleClearBtn.style.color = "var(--red)"
          
          if (singleConfirmTimeout) clearTimeout(singleConfirmTimeout)
          singleConfirmTimeout = window.setTimeout(() => {
            singleClearBtn.classList.remove("confirming")
            singleClearBtn.innerHTML = originalIcon
            singleClearBtn.style.fontSize = ""
            singleClearBtn.style.color = ""
          }, 3000)
        }
      })
    }
  })
}

document.addEventListener("nav", () => {
  setupFlashcardSummary()
})
