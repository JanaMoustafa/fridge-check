export const THEMES = ['light', 'dark', 'system'] as const
export type Theme = (typeof THEMES)[number]
export const THEME_STORAGE_KEY = 'fc:theme'
export const DEFAULT_THEME: Theme = 'system'

/** Page canvas colours (`--c-bg`) used for the browser chrome (`theme-color`). */
export const THEME_COLORS = { light: '#edf2ef', dark: '#121916' } as const
/** Script-owned theme-color meta. Next re-inserts its own media-keyed metas on navigation, so a
 *  forced theme is expressed by one extra media-less meta placed first in <head> (first match wins). */
export const THEME_COLOR_META_ID = 'fc-theme-color'

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export function parseTheme(value: string | null | undefined): Theme {
  return isTheme(value) ? value : DEFAULT_THEME
}

/** `system` removes the overrides so the prefers-color-scheme media queries decide. */
export function applyTheme(doc: Document, theme: Theme): void {
  const root = doc.documentElement
  const existing = doc.getElementById(THEME_COLOR_META_ID)
  if (theme === 'system') {
    root.removeAttribute('data-theme')
    existing?.remove()
    return
  }
  root.setAttribute('data-theme', theme)
  const meta = existing ?? doc.createElement('meta')
  meta.id = THEME_COLOR_META_ID
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', THEME_COLORS[theme])
  if (!existing) doc.head.prepend(meta)
}
