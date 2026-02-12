// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline"
// @ts-ignore
import scrollProgressScript from "./scripts/scrollProgress.inline"
import clipboardStyle from "./styles/clipboard.scss"
import scrollProgressStyle from "./styles/scrollProgress.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Body: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return (
    <div id="quartz-body">
      <div id="scroll-progress-bar" />
      {children}
    </div>
  )
}

Body.afterDOMLoaded = [clipboardScript, scrollProgressScript]
Body.css = [clipboardStyle, scrollProgressStyle]

export default (() => Body) satisfies QuartzComponentConstructor
