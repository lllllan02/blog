import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/domainHeader.scss"
// @ts-ignore
import script from "./scripts/domainHeader.inline"

interface DomainOption {
  slug: string
  title: string
  order: number
}

export default (() => {
  const DomainHeader: QuartzComponent = ({ allFiles, fileData, displayClass }: QuartzComponentProps) => {
    const domains = new Map<string, DomainOption>()
    const folderDomains = new Set<string>()
    
    allFiles.forEach((file) => {
      const slug = file.slug
      if (!slug || slug === "index") return

      const parts = slug.split("/")
      if (parts.length > 0 && parts[0] !== "index" && parts[0] !== "tags" && parts[0] !== "wiki") {
        const domainSlug = parts[0]
        
        // 如果路径深度大于1，说明这是一个文件夹
        if (parts.length > 1) {
          folderDomains.add(domainSlug)
        }

        // 尝试获取该目录的 index 文件的元数据
        // 1. 如果当前文件就是该目录的 index 文件 (e.g. content/Go/index.md)
        if (parts.length === 2 && parts[1] === "index") {
          const title = file.frontmatter?.title ?? domainSlug
          const order = (file.frontmatter?.order as number) ?? Infinity
          domains.set(domainSlug, { slug: domainSlug, title, order })
        } 
        // 2. 如果还没有记录该域名，先用默认值占位
        else if (!domains.has(domainSlug)) {
          domains.set(domainSlug, { 
            slug: domainSlug, 
            title: domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1), 
            order: Infinity 
          })
        }
      }
    })

    const sortedDomains = Array.from(domains.values()).sort((a, b) => {
      // 1. 首先按 order 排序
      if (a.order !== Infinity || b.order !== Infinity) {
        if (a.order !== b.order) {
          return a.order - b.order
        }
      }

      // 2. 其次按文件夹优先排序 (模拟 Explorer 的逻辑)
      const aIsFolder = folderDomains.has(a.slug)
      const bIsFolder = folderDomains.has(b.slug)
      
      if (aIsFolder && !bIsFolder) return -1
      if (!aIsFolder && bIsFolder) return 1

      // 3. 最后按 title 字母顺序排序，使用与 Explorer 相同的比较选项
      return a.title.localeCompare(b.title, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    })

    const currentDomainSlug = fileData.slug?.split("/")[0]
    const currentDomain = domains.get(currentDomainSlug ?? "")
    
    const selectedLabel = currentDomain ? currentDomain.title : "Home"

    return (
      <div class={`domain-header-container ${displayClass ?? ""}`}>
        <div class="domain-dropdown">
          <button class="domain-trigger" aria-expanded="false" aria-controls="domain-list">
            <span class="domain-current">{selectedLabel}</span>
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
              class="domain-arrow"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div id="domain-list" class="domain-menu">
            <ul>
              <li>
                <a href="/" class={!currentDomainSlug || !domains.has(currentDomainSlug) ? "active" : ""}>
                  Home
                </a>
              </li>
              {sortedDomains.map((domain) => (
                <li>
                  <a href={`/${domain.slug}`} class={currentDomainSlug === domain.slug ? "active" : ""}>
                    {domain.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  DomainHeader.css = style
  DomainHeader.afterDOMLoaded = script
  return DomainHeader
}) satisfies QuartzComponentConstructor
