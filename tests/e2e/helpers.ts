import type { BrowserContext, Page } from '@playwright/test'

export type Locale = 'en' | 'ar'

export async function setLocaleCookie(context: BrowserContext, baseURL: string, locale: Locale) {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: baseURL }])
}

export async function htmlAttrs(page: Page) {
  return page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    theme: document.documentElement.getAttribute('data-theme'),
  }))
}

export async function hasHorizontalScroll(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}
