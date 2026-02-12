export interface ColorScheme {
  light: string
  lightgray: string
  gray: string
  darkgray: string
  dark: string
  secondary: string
  tertiary: string
  highlight: string
  textHighlight: string
}

interface Colors {
  lightMode: ColorScheme
  darkMode: ColorScheme
}

export type FontSpecification =
  | string
  | {
      name: string
      weights?: number[]
      includeItalic?: boolean
    }

/** 顶部阅读进度条配色预设：cyan | purple | warm | theme */
export type ProgressBarPreset = "cyan" | "purple" | "warm" | "theme"

export interface Theme {
  typography: {
    title?: FontSpecification
    header: FontSpecification
    body: FontSpecification
    code: FontSpecification
  }
  cdnCaching: boolean
  colors: Colors
  fontOrigin: "googleFonts" | "local"
  /** 顶部阅读进度条配色预设，默认 cyan */
  progressBarPreset?: ProgressBarPreset
}

export type ThemeKey = keyof Colors

const DEFAULT_SANS_SERIF =
  'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
const DEFAULT_MONO = "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace"

export function getFontSpecificationName(spec: FontSpecification): string {
  if (typeof spec === "string") {
    return spec
  }

  return spec.name
}

function formatFontSpecification(
  type: "title" | "header" | "body" | "code",
  spec: FontSpecification,
) {
  if (typeof spec === "string") {
    spec = { name: spec }
  }

  const defaultIncludeWeights = type === "header" ? [400, 700] : [400, 600]
  const defaultIncludeItalic = type === "body"
  const weights = spec.weights ?? defaultIncludeWeights
  const italic = spec.includeItalic ?? defaultIncludeItalic

  const features: string[] = []
  if (italic) {
    features.push("ital")
  }

  if (weights.length > 1) {
    const weightSpec = italic
      ? weights
          .flatMap((w) => [`0,${w}`, `1,${w}`])
          .sort()
          .join(";")
      : weights.join(";")

    features.push(`wght@${weightSpec}`)
  }

  if (features.length > 0) {
    return `${spec.name}:${features.join(",")}`
  }

  return spec.name
}

export function googleFontHref(theme: Theme) {
  const { header, body, code } = theme.typography
  const headerFont = formatFontSpecification("header", header)
  const bodyFont = formatFontSpecification("body", body)
  const codeFont = formatFontSpecification("code", code)

  return `https://fonts.googleapis.com/css2?family=${headerFont}&family=${bodyFont}&family=${codeFont}&display=swap`
}

export function googleFontSubsetHref(theme: Theme, text: string) {
  const title = theme.typography.title || theme.typography.header
  const titleFont = formatFontSpecification("title", title)

  return `https://fonts.googleapis.com/css2?family=${titleFont}&text=${encodeURIComponent(text)}&display=swap`
}

export interface GoogleFontFile {
  url: string
  filename: string
  extension: string
}

const fontMimeMap: Record<string, string> = {
  truetype: "ttf",
  woff: "woff",
  woff2: "woff2",
  opentype: "otf",
}

export async function processGoogleFonts(
  stylesheet: string,
  baseUrl: string,
): Promise<{
  processedStylesheet: string
  fontFiles: GoogleFontFile[]
}> {
  const fontSourceRegex =
    /url\((https:\/\/fonts.gstatic.com\/.+(?:\/|(?:kit=))(.+?)[.&].+?)\)\sformat\('(\w+?)'\);/g
  const fontFiles: GoogleFontFile[] = []
  let processedStylesheet = stylesheet

  let match
  while ((match = fontSourceRegex.exec(stylesheet)) !== null) {
    const url = match[1]
    const filename = match[2]
    const extension = fontMimeMap[match[3].toLowerCase()]
    const staticUrl = `https://${baseUrl}/static/fonts/${filename}.${extension}`

    processedStylesheet = processedStylesheet.replace(url, staticUrl)
    fontFiles.push({ url, filename, extension })
  }

  return { processedStylesheet, fontFiles }
}

// 渐变结构：深色起点 → 柔和过渡 → 对比色收尾（增强层次感）
const PROGRESS_BAR_PRESETS: Record<
  ProgressBarPreset,
  { light: [string, string, string]; dark: [string, string, string] }
> = {
  cyan: {
    // 深青 → 翠青 → 天蓝（色相由青转蓝，更鲜明）
    light: ["#0f766e", "#14b8a6", "#0ea5e9"],
    dark: ["#0d9488", "#2dd4bf", "#38bdf8"],
  },
  purple: {
    // 靛蓝 → 薰衣草 → 粉紫（保持原有最佳效果）
    light: ["#6366f1", "#a78bfa", "#ec4899"],
    dark: ["#818cf8", "#c4b5fd", "#f472b6"],
  },
  warm: {
    // 红 → 橙 → 金（暖色全光谱，色相跨度更大）
    light: ["#b91c1c", "#ea580c", "#eab308"],
    dark: ["#dc2626", "#f97316", "#fde047"],
  },
  theme: {
    // 主题色系，用 color-mix 丰富中间过渡
    light: [
      "var(--secondary)",
      "color-mix(in srgb, var(--tertiary) 55%, var(--link-color))",
      "var(--link-color)",
    ],
    dark: [
      "var(--secondary)",
      "color-mix(in srgb, var(--tertiary) 55%, var(--link-color))",
      "var(--link-color)",
    ],
  },
}

function getProgressBarVars(theme: Theme) {
  const preset = theme.progressBarPreset ?? "cyan"
  const { light, dark } = PROGRESS_BAR_PRESETS[preset]
  return {
    light: `--progress-bar-start: ${light[0]}; --progress-bar-mid: ${light[1]}; --progress-bar-end: ${light[2]};`,
    dark: `--progress-bar-start: ${dark[0]}; --progress-bar-mid: ${dark[1]}; --progress-bar-end: ${dark[2]};`,
  }
}

export function joinStyles(theme: Theme, ...stylesheet: string[]) {
  const progressBar = getProgressBarVars(theme)
  return `
${stylesheet.join("\n\n")}

:root {
  --light: ${theme.colors.lightMode.light};
  --lightgray: ${theme.colors.lightMode.lightgray};
  --gray: ${theme.colors.lightMode.gray};
  --darkgray: ${theme.colors.lightMode.darkgray};
  --dark: ${theme.colors.lightMode.dark};
  --secondary: ${theme.colors.lightMode.secondary};
  --tertiary: ${theme.colors.lightMode.tertiary};
  --highlight: ${theme.colors.lightMode.highlight};
  --textHighlight: ${theme.colors.lightMode.textHighlight};
  ${progressBar.light}

  --titleFont: "${getFontSpecificationName(theme.typography.title || theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --headerFont: "${getFontSpecificationName(theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --bodyFont: "${getFontSpecificationName(theme.typography.body)}", ${DEFAULT_SANS_SERIF};
  --codeFont: "${getFontSpecificationName(theme.typography.code)}", ${DEFAULT_MONO};
}

:root[saved-theme="dark"] {
  --light: ${theme.colors.darkMode.light};
  --lightgray: ${theme.colors.darkMode.lightgray};
  --gray: ${theme.colors.darkMode.gray};
  --darkgray: ${theme.colors.darkMode.darkgray};
  --dark: ${theme.colors.darkMode.dark};
  --secondary: ${theme.colors.darkMode.secondary};
  --tertiary: ${theme.colors.darkMode.tertiary};
  --highlight: ${theme.colors.darkMode.highlight};
  --textHighlight: ${theme.colors.darkMode.textHighlight};
  ${progressBar.dark}
}
`
}
