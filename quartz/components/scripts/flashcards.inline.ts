import { FullSlug } from "../../util/path"

interface Card {
  title: string
  slug: FullSlug
}

  async function setupFlashcards() {
    const container = document.querySelector(".flashcards-container") as HTMLElement
    const toggle = document.querySelector(".flashcards-toggle") as HTMLElement
    const qText = document.getElementById("flashcard-q-text") as HTMLElement
    const controls = document.querySelector(".flashcard-controls") as HTMLElement
    const viewBtn = document.getElementById("flashcard-view") as HTMLButtonElement
    const knownBtn = document.getElementById("flashcard-known") as HTMLButtonElement

    if (!container || !toggle || !controls) return

    // Remove existing listeners to avoid duplicates
    const newToggle = toggle.cloneNode(true) as HTMLElement
    toggle.parentNode?.replaceChild(newToggle, toggle)
    const newViewBtn = viewBtn.cloneNode(true) as HTMLButtonElement
    viewBtn.parentNode?.replaceChild(newViewBtn, viewBtn)
    const newKnownBtn = knownBtn.cloneNode(true) as HTMLButtonElement
    knownBtn.parentNode?.replaceChild(newKnownBtn, knownBtn)

    const STORAGE_KEY_KNOWN = "quartz-flashcards-known"
    const STORAGE_KEY_VIEWS = "quartz-flashcards-views"
    const STORAGE_KEY_MASTERED_COUNT = "quartz-flashcards-mastered-count"
    const STORAGE_KEY_LAST_SEEN = "quartz-flashcards-last-seen"
    const STORAGE_KEY_WEIGHTS = "quartz-flashcards-weights"

    let knownSlugs: Set<string> = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_KNOWN) || "[]"))
    let viewCounts: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_VIEWS) || "{}")
    let masteredCounts: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_MASTERED_COUNT) || "{}")
    let lastSeen: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_LAST_SEEN) || "{}")
    let weights: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_WEIGHTS) || "{}")

    const COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes for soft penalty

    let cards: Card[] = []
    let currentIndex = 0

    // Toggle visibility
    newToggle.addEventListener("click", () => {
      container.classList.toggle("inactive")
    })

    // Fetch cards
    try {
      const response = await fetch("/static/contentIndex.json")
      const data = await response.json()
      
      const allCards = Object.entries(data)
        .filter(([_, details]: [string, any]) => details.frontmatter?.card === true)
        .map(([slug, details]: [string, any]) => ({
          title: details.title,
          slug: slug as FullSlug,
        }))

      // Filter only mastered cards
      cards = allCards.filter(card => !knownSlugs.has(card.slug))

      if (cards.length === 0 && allCards.length > 0) {
        // If all cards are known, show a message and don't reset automatically
        qText.innerText = "All cards mastered! Go to summary to reset."
        controls.style.display = "none"
        return
      } else if (cards.length === 0) {
        qText.innerText = "No cards found. Add 'card: true' to your frontmatter."
        controls.style.display = "none"
        return
      }

      // Ensure buttons are visible if we have cards
      controls.style.display = "flex"

      // Initial selection
      selectNextCard()
      updateCard()
    } catch (e) {
      console.error("Failed to fetch flashcards", e)
      qText.innerText = "Error loading cards."
    }

    function selectNextCard() {
      if (cards.length === 0) return

      const now = Date.now()
      const ONE_DAY_MS = 24 * 60 * 60 * 1000

      // Weighted Random Selection with Time Compensation & Soft Penalty
      const cardWeights = cards.map(card => {
        let baseWeight = weights[card.slug] || 1
        const views = viewCounts[card.slug] || 0
        const lastTime = lastSeen[card.slug] || 0

        // 1. New Card Boost: Never seen cards get a higher initial weight
        if (views === 0) {
          baseWeight = 3
        }

        // 2. Time Compensation (Anti-Starvation): 
        // Increase weight if the card hasn't been seen for a long time.
        if (lastTime > 0) {
          const daysSinceLastSeen = Math.floor((now - lastTime) / ONE_DAY_MS)
          baseWeight += daysSinceLastSeen
        }

        // 3. Soft Penalty (Cooldown):
        // If the card was seen very recently, significantly reduce its weight.
        if (lastTime > 0 && (now - lastTime) < COOLDOWN_MS) {
          baseWeight *= 0.1
        }

        return baseWeight
      })

      const totalWeight = cardWeights.reduce((a, b) => a + b, 0)
      let random = Math.random() * totalWeight
      
      for (let i = 0; i < cards.length; i++) {
        if (random < cardWeights[i]) {
          currentIndex = i
          return
        }
        random -= cardWeights[i]
      }
      currentIndex = 0
    }

    function updateCard() {
      if (cards.length === 0) return
      const card = cards[currentIndex]
      qText.innerText = card.title
    }

    newViewBtn.addEventListener("click", () => {
      if (cards.length === 0) return
      const card = cards[currentIndex]
      
      // Record view
      viewCounts[card.slug] = (viewCounts[card.slug] || 0) + 1
      localStorage.setItem(STORAGE_KEY_VIEWS, JSON.stringify(viewCounts))

      // Increase weight because user needed to see the answer
      weights[card.slug] = (weights[card.slug] || 1) + 2
      localStorage.setItem(STORAGE_KEY_WEIGHTS, JSON.stringify(weights))

      // Record last seen
      lastSeen[card.slug] = Date.now()
      localStorage.setItem(STORAGE_KEY_LAST_SEEN, JSON.stringify(lastSeen))

      const destination = window.location.origin + "/" + card.slug
      window.spaNavigate(new URL(destination))
    })

    newKnownBtn?.addEventListener("click", () => {
      if (cards.length === 0) return
      const card = cards[currentIndex]

      // Decrease weight because user knows it
      weights[card.slug] = Math.max(1, (weights[card.slug] || 1) - 1)
      localStorage.setItem(STORAGE_KEY_WEIGHTS, JSON.stringify(weights))

      knownSlugs.add(card.slug)
      localStorage.setItem(STORAGE_KEY_KNOWN, JSON.stringify(Array.from(knownSlugs)))
      
      // Record mastery count
      masteredCounts[card.slug] = (masteredCounts[card.slug] || 0) + 1
      localStorage.setItem(STORAGE_KEY_MASTERED_COUNT, JSON.stringify(masteredCounts))

      // Record last seen
      lastSeen[card.slug] = Date.now()
      localStorage.setItem(STORAGE_KEY_LAST_SEEN, JSON.stringify(lastSeen))

      // Remove current card from active list
      cards.splice(currentIndex, 1)
      if (cards.length === 0) {
        qText.innerText = "All cards mastered! Refresh to restart."
        controls.style.display = "none"
      } else {
        selectNextCard()
        updateCard()
      }
    })
  }

document.addEventListener("nav", () => {
  setupFlashcards()
})
