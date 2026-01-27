import { FullSlug } from "../../util/path"

interface Card {
  title: string
  slug: FullSlug
}

async function setupFlashcards() {
  const container = document.querySelector(".flashcards-container") as HTMLElement
  const toggle = document.querySelector(".flashcards-toggle") as HTMLElement
  const qText = document.getElementById("flashcard-q-text") as HTMLElement
  const viewBtn = document.getElementById("flashcard-view") as HTMLButtonElement
  const knownBtn = document.getElementById("flashcard-known") as HTMLButtonElement

  if (!container || !toggle) return

  const STORAGE_KEY = "quartz-flashcards-known"
  let knownSlugs: Set<string> = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))
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

    // Filter unknown cards first
    cards = allCards.filter(card => !knownSlugs.has(card.slug))

    if (cards.length === 0 && allCards.length > 0) {
      // If all cards are known, maybe show them all again or show a message
      qText.innerText = "All cards mastered! Resetting..."
      knownSlugs.clear()
      localStorage.setItem(STORAGE_KEY, "[]")
      cards = allCards
    } else if (cards.length === 0) {
      qText.innerText = "No cards found. Add 'card: true' to your frontmatter."
      return
    }

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

  knownBtn?.addEventListener("click", () => {
    if (cards.length === 0) return
    const card = cards[currentIndex]
    knownSlugs.add(card.slug)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(knownSlugs)))
    
    // Remove current card from active list
    cards.splice(currentIndex, 1)
    if (cards.length === 0) {
      qText.innerText = "All cards mastered! Refresh to restart."
    } else {
      if (currentIndex >= cards.length) {
        currentIndex = 0
      }
      updateCard()
    }
  })

  viewBtn.addEventListener("click", () => {
    if (cards.length === 0) return
    const card = cards[currentIndex]
    const destination = window.location.origin + "/" + card.slug
    window.spaNavigate(new URL(destination))
  })
}

document.addEventListener("nav", () => {
  setupFlashcards()
})
