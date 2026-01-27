import { FullSlug } from "../../util/path"

interface Card {
  title: string
  slug: FullSlug
}

async function setupFlashcards() {
  const container = document.querySelector(".flashcards-container") as HTMLElement
  const toggle = document.querySelector(".flashcards-toggle") as HTMLElement
  const qText = document.getElementById("flashcard-q-text") as HTMLElement
  const countText = document.getElementById("flashcard-count") as HTMLElement
  const viewBtn = document.getElementById("flashcard-view") as HTMLButtonElement
  const prevBtn = document.getElementById("flashcard-prev") as HTMLButtonElement
  const nextBtn = document.getElementById("flashcard-next") as HTMLButtonElement

  if (!container || !toggle) return

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
    
    cards = Object.entries(data)
      .filter(([_, details]: [string, any]) => details.frontmatter?.card === true)
      .map(([slug, details]: [string, any]) => ({
        title: details.title,
        slug: slug as FullSlug,
      }))

    if (cards.length === 0) {
      qText.innerText = "No cards found. Add 'card: true' to your frontmatter."
      return
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
    countText.innerText = `${currentIndex + 1}/${cards.length}`
  }

  viewBtn.addEventListener("click", () => {
    if (cards.length === 0) return
    const card = cards[currentIndex]
    const destination = window.location.origin + "/" + card.slug
    window.spaNavigate(new URL(destination))
  })

  prevBtn.addEventListener("click", () => {
    if (cards.length === 0) return
    currentIndex = (currentIndex - 1 + cards.length) % cards.length
    updateCard()
  })

  nextBtn.addEventListener("click", () => {
    if (cards.length === 0) return
    currentIndex = (currentIndex + 1) % cards.length
    updateCard()
  })
}

document.addEventListener("nav", () => {
  setupFlashcards()
})
