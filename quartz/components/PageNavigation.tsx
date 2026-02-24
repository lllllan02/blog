import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, SimpleSlug, resolveRelative, pathToRoot, joinSegments } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { byDateAndAlphabetical } from "./PageList"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

interface Options {
  sort: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

const defaultOptions: Options = {
  sort: (f1, f2) => {
    if (f1.dates && f2.dates) {
      return getDate(f1)!.getTime() - getDate(f2)!.getTime()
    }
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  },
}

function getDate(f: QuartzPluginData): Date | undefined {
  if (!f.dates) return undefined
  return f.dates.published ?? f.dates.created ?? f.dates.modified
}

export default ((userOpts?: Partial<Options>) => {
  const PageNavigation: QuartzComponent = ({
    allFiles,
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const opts = { ...defaultOptions, ...userOpts }
    const currentSlug = fileData.slug!
    const currentDir = currentSlug.split("/").slice(0, -1).join("/")

    const list = allFiles
      .filter((f) => {
        const dir = f.slug!.split("/").slice(0, -1).join("/")
        return dir === currentDir && f.slug !== currentSlug && f.slug !== joinSegments(currentDir, "index") as FullSlug
      })
      .sort(opts.sort)

    const currentIndex = list.findIndex((f) => f.slug === currentSlug)
    // Since we filtered out currentSlug, we need to find where it would be
    const allInDir = allFiles
      .filter((f) => {
        const dir = f.slug!.split("/").slice(0, -1).join("/")
        return dir === currentDir && f.slug !== joinSegments(currentDir, "index") as FullSlug
      })
      .sort(opts.sort)
    
    const index = allInDir.findIndex((f) => f.slug === currentSlug)
    const prev = index > 0 ? allInDir[index - 1] : undefined
    const next = index < allInDir.length - 1 ? allInDir[index + 1] : undefined

    if (!prev && !next) {
      return null
    }

    return (
      <div class={classNames(displayClass, "page-navigation")}>
        <div class="prev">
          {prev && (
            <a href={resolveRelative(fileData.slug!, prev.slug!)} rel="prev">
              <span class="label">{i18n(cfg.locale).components.pageNavigation.prev}</span>
              <span class="title">{prev.frontmatter?.title}</span>
            </a>
          )}
        </div>
        <div class="next">
          {next && (
            <a href={resolveRelative(fileData.slug!, next.slug!)} rel="next">
              <span class="label">{i18n(cfg.locale).components.pageNavigation.next}</span>
              <span class="title">{next.frontmatter?.title}</span>
            </a>
          )}
        </div>
      </div>
    )
  }

  PageNavigation.css = `
  .page-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 3rem;
    padding-top: 1rem;
    gap: 1rem;
  }
  .page-navigation .prev, .page-navigation .next {
    flex: 1;
    display: flex;
  }
  .page-navigation .next {
    justify-content: flex-end;
    text-align: right;
  }
  .page-navigation a {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    transition: color 0.2s ease;
    max-width: 100%;
  }
  .page-navigation a:hover .title {
    color: var(--secondary);
  }
  .page-navigation .label {
    font-size: 0.8rem;
    color: var(--gray);
    text-transform: uppercase;
  }
  .page-navigation .title {
    font-weight: 600;
    margin-top: 0.2rem;
    color: var(--tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  `
  return PageNavigation
}) satisfies QuartzComponentConstructor
