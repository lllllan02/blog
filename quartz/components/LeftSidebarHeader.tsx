import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/leftSidebarHeader.scss"
import PageTitle from "./PageTitle"
import Search from "./Search"
import Darkmode from "./Darkmode"
import ReaderMode from "./ReaderMode"
import DomainHeader from "./DomainHeader"
import { concatenateResources } from "../util/resources"

export default (() => {
  const PageTitleComponent = PageTitle()
  const SearchComponent = Search()
  const DarkmodeComponent = Darkmode()
  const ReaderModeComponent = ReaderMode()
  const DomainHeaderComponent = DomainHeader()

  const LeftSidebarHeader: QuartzComponent = (props: QuartzComponentProps) => {
    return (
      <div class="left-sidebar-header">
        <div class="lsh-title">
          <PageTitleComponent {...props} />
        </div>
        <div class="lsh-search-tools">
          <div class="lsh-search">
            <SearchComponent {...props} />
          </div>
          <div class="lsh-tools">
            <DarkmodeComponent {...props} />
            <ReaderModeComponent {...props} />
          </div>
        </div>
        <div class="lsh-domain">
          <DomainHeaderComponent {...props} />
        </div>
      </div>
    )
  }

  LeftSidebarHeader.css = concatenateResources(
    style,
    PageTitleComponent.css,
    SearchComponent.css,
    DarkmodeComponent.css,
    ReaderModeComponent.css,
    DomainHeaderComponent.css,
  )
  LeftSidebarHeader.afterDOMLoaded = concatenateResources(
    PageTitleComponent.afterDOMLoaded,
    SearchComponent.afterDOMLoaded,
    DarkmodeComponent.afterDOMLoaded,
    ReaderModeComponent.afterDOMLoaded,
    DomainHeaderComponent.afterDOMLoaded,
  )
  LeftSidebarHeader.beforeDOMLoaded = concatenateResources(
    PageTitleComponent.beforeDOMLoaded,
    SearchComponent.beforeDOMLoaded,
    DarkmodeComponent.beforeDOMLoaded,
    ReaderModeComponent.beforeDOMLoaded,
    DomainHeaderComponent.beforeDOMLoaded,
  )

  return LeftSidebarHeader
}) satisfies QuartzComponentConstructor
