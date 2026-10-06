// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, isTheme, parseTheme, THEME_COLOR_META_ID } from './theme'

const themeMeta = () => document.getElementById(THEME_COLOR_META_ID)

describe('theme helpers', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.head.innerHTML =
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#edf2ef">'
  })

  it('recognises valid themes', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('sepia')).toBe(false)
  })

  it('parses unknown values to system', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme(null)).toBe('system')
    expect(parseTheme('neon')).toBe('system')
  })

  it('sets data-theme and a first-in-head theme-color for explicit themes', () => {
    applyTheme(document, 'dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.head.firstElementChild).toBe(themeMeta())
    expect(themeMeta()?.getAttribute('content')).toBe('#121916')
    expect(themeMeta()?.hasAttribute('media')).toBe(false)
  })

  it('updates the existing meta instead of adding another', () => {
    applyTheme(document, 'dark')
    applyTheme(document, 'light')
    expect(document.querySelectorAll(`#${THEME_COLOR_META_ID}`)).toHaveLength(1)
    expect(themeMeta()?.getAttribute('content')).toBe('#edf2ef')
  })

  it('removes the overrides for system', () => {
    applyTheme(document, 'dark')
    applyTheme(document, 'system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(themeMeta()).toBeNull()
  })
})
