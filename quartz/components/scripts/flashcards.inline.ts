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

  const STORAGE_KEY_KNOWN = "quartz-flashcards-known"
  const STORAGE_KEY_VIEWS = "quartz-flashcards-views"
  const STORAGE_KEY_MASTERED_COUNT = "quartz-flashcards-mastered-count"
  const STORAGE_KEY_LAST_SEEN = "quartz-flashcards-last-seen"

  let knownSlugs: Set<string> = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_KNOWN) || "[]"))
  let viewCounts: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_VIEWS) || "{}")
  let masteredCounts: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_MASTERED_COUNT) || "{}")
  let lastSeen: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_KEY_LAST_SEEN) || "{}")

  const COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes in milliseconds

  let cards: Card[] = []
  let currentIndex = 0

  // Toggle visibility
  toggle.addEventListener("click", () => {
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

    // Filter unknown cards and respect cooldown
    const now = Date.now()
    cards = allCards.filter(card => {
      if (knownSlugs.has(card.slug)) return false
      const lastTime = lastSeen[card.slug] || 0
      return now - lastTime > COOLDOWN_MS
    })

    if (cards.length === 0 && allCards.length > 0) {
      // Check if all cards are filtered out due to cooldown
      const unmasteredCards = allCards.filter(card => !knownSlugs.has(card.slug))
      if (unmasteredCards.length > 0) {
        qText.innerText = "No new cards for now. Come back later!"
        controls.style.display = "none"
        return
      }

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

    // Shuffle cards
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]]
    }

    updateCard()
  } catch (e) {
    console.error("Failed to fetch flashcards", e)
    qText.innerText = "Error loading cards."
  }

  function updateCard() {
    if (cards.length === 0) return
    const card = cards[currentIndex]
    qText.innerText = card.title
  }

  viewBtn.addEventListener("click", () => {
    if (cards.length === 0) return
    const card = cards[currentIndex]
    
    // Record view
    viewCounts[card.slug] = (viewCounts[card.slug] || 0) + 1
    localStorage.setItem(STORAGE_KEY_VIEWS, JSON.stringify(viewCounts))

    // Record last seen
    lastSeen[card.slug] = Date.now()
    localStorage.setItem(STORAGE_KEY_LAST_SEEN, JSON.stringify(lastSeen))

    const destination = window.location.origin + "/" + card.slug
    window.spaNavigate(new URL(destination))
  })

  knownBtn?.addEventListener("click", () => {
    if (cards.length === 0) return
    const card = cards[currentIndex]
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
      if (currentIndex >= cards.length) {
        currentIndex = 0
      }
      updateCard()
    }
  })
}

document.addEventListener("nav", () => {
  setupFlashcards()
})
