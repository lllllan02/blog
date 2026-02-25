import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, simplifySlug } from "../util/path"
import { classNames } from "../util/lang"

const WikiCloud: QuartzComponent = ({ allFiles, fileData, displayClass }: QuartzComponentProps) => {
  const wikiFiles = allFiles.filter(
    (f) => f.slug?.startsWith("wiki/") && f.slug !== "wiki/index" && !f.frontmatter?.noindex,
  )

  // Calculate backlink counts
  const backlinkCounts = new Map<string, number>()
  for (const file of allFiles) {
    const links = file.links ?? []
    for (const link of links) {
      backlinkCounts.set(link, (backlinkCounts.get(link) ?? 0) + 1)
    }
  }

  // Get min/max counts for normalization
  let minCount = Infinity
  let maxCount = 0
  
  wikiFiles.forEach((file) => {
    const slug = simplifySlug(file.slug!)
    const count = backlinkCounts.get(slug) ?? 0
    minCount = Math.min(minCount, count)
    maxCount = Math.max(maxCount, count)
  })

  // Size based on backlink count
  const getFontSize = (slug: string) => {
    const count = backlinkCounts.get(slug) ?? 0
    
    // If all files have same count (e.g. 0), use base size
    if (maxCount === minCount) return "1.2rem"
    
    // Normalize to 1rem - 2.5rem
    const minSize = 1
    const maxSize = 2.5
    const normalized = (count - minCount) / (maxCount - minCount)
    const size = minSize + normalized * (maxSize - minSize)
    
    return `${size.toFixed(2)}rem`
  }

  // Color based on backlink count
  const getColor = (slug: string) => {
    const count = backlinkCounts.get(slug) ?? 0
    
    // If all files have same count, use default color
    if (maxCount === minCount) return "var(--darkgray)"

    // 5 tiers of importance
    const normalized = (count - minCount) / (maxCount - minCount)
    
    if (normalized > 0.8) return "var(--secondary)" // Most important
    if (normalized > 0.6) return "var(--tertiary)"
    if (normalized > 0.4) return "var(--dark)"
    if (normalized > 0.2) return "var(--darkgray)"
    return "var(--gray)" // Least important
  }

  return (
    <div class={classNames(displayClass, "wiki-cloud")}>
      <div class="cloud-container">
        {wikiFiles.map((file) => {
          const title = file.frontmatter?.title ?? "Untitled"
          const slug = simplifySlug(file.slug!)
          const fontSize = getFontSize(slug)
          const color = getColor(slug)
          const linkDest = resolveRelative(fileData.slug!, file.slug!)

          return (
            <a
              href={linkDest}
              class="internal cloud-item"
              style={{ fontSize, color: color }}
            >
              {title}
            </a>
          )
        })}
      </div>
    </div>
  )
}

WikiCloud.css = `
.wiki-cloud {
  margin: 2rem 0;
}

.cloud-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--lightgray);
  border-radius: 8px;
}

.cloud-item {
  text-decoration: none;
  transition: transform 0.2s ease;
  line-height: 1.2;
}

.cloud-item:hover {
  transform: scale(1.1);
  text-decoration: underline;
}

/* Hide the separator line between content and footer on wiki map pages */
body[data-slug="wiki-cloud"] .center > hr,
body[data-slug="wiki/index"] .center > hr {
  display: none;
}
`

export default (() => WikiCloud) satisfies QuartzComponentConstructor
