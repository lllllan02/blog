import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/flashcards.inline"
import style from "./styles/flashcards.scss"
import { classNames } from "../util/lang"

export default (() => {
  const Flashcards: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "flashcards")}>
        <div class="flashcards-header">
          <h3>Flashcards</h3>
          <button class="flashcards-toggle" aria-label="Toggle Flashcards">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </button>
        </div>
        <div class="flashcards-container">
          <div class="flashcard-card">
            <div class="flashcard-question">
              <p id="flashcard-q-text">Loading cards...</p>
            </div>
            <div class="flashcard-controls">
              <button id="flashcard-view" class="control-btn flip-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                View Answer
              </button>
              <button id="flashcard-known" class="control-btn known-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Mastered
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  Flashcards.css = style
  Flashcards.afterDOMLoaded = script

  return Flashcards
}) satisfies QuartzComponentConstructor
