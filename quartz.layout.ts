import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components" 

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.ConditionalRender({
      component: Component.WikiCloud(),
      condition: (page) => page.fileData.slug === "wiki-cloud" || page.fileData.slug === "wiki/index",
    }),
    Component.ConditionalRender({
      component: Component.PageNavigation(),
      condition: (page) => page.fileData.slug !== "index",
    }),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/lllllan02",
      Font: "https://github.com/lxgw/LxgwWenKai",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ConditionalRender({
      component: Component.FlashcardSummary(),
      condition: (page) => page.fileData.slug === "flashcards",
    }),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.MobileOnly(Component.Spacer()),
    Component.LeftSidebarHeader(),
    Component.Explorer({
      filterFn: (node) => node.slugSegment !== "wiki" && node.slugSegment !== "tags",
      scopeToCurrentDomain: true,
    }),
  ],
  right: [
    // Component.Graph(),
    Component.Flashcards(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = defaultContentPageLayout
