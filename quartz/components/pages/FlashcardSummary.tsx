import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { resolveRelative } from "../../util/path"
// @ts-ignore
import script from "../scripts/flashcard-summary.inline"

export default (() => {
  const FlashcardSummary: QuartzComponent = (props: QuartzComponentProps) => {
    const { allFiles, fileData } = props
    const flashcards = allFiles.filter((file) => file.frontmatter?.card === true)

    return (
      <div class="flashcard-summary">
        <div id="flashcard-summary-container">
          <div class="summary-info">
            <span id="summary-stats">Loading statistics...</span>
            <button id="clear-stats-btn" class="clear-all-btn" title="Clear All Statistics">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Clear All
            </button>
          </div>
        </div>
        <div class="flashcard-list">
          <table>
            <thead>
              <tr>
                <th>Card Title</th>
                <th>Views</th>
                <th>Mastered</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {flashcards.map((card) => {
                const href = resolveRelative(fileData.slug!, card.slug!)
                return (
                  <tr key={card.slug} data-slug={card.slug}>
                    <td>
                      <a href={href} class="internal">
                        {(card.frontmatter?.title as string) ?? card.name}
                      </a>
                    </td>
                    <td class="view-count">0</td>
                    <td class="mastered-count">0</td>
                    <td class="status">Pending</td>
                    <td>
                      <button class="clear-single-btn" title="Clear this card's stats">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  FlashcardSummary.afterDOMLoaded = script

  return FlashcardSummary
}) satisfies QuartzComponentConstructor
