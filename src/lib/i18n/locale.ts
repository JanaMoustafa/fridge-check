export const LOCALES = ['en', 'ar'] as const
export type Locale = (typeof LOCALES)[number]
export type Direction = 'ltr' | 'rtl'

export const DEFAULT_LOCALE: Locale = 'en'
/** Server-readable source of truth for SSR (`lang`/`dir` on first paint). */
export const LOCALE_COOKIE = 'NEXT_LOCALE'
/** Client-side mirror of the user's choice (owner requirement). */
export const LOCALE_STORAGE_KEY = 'fc:locale'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function directionOf(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

/**
 * Picks the best supported locale from an Accept-Language header,
 * honouring q-values ("ar-EG,ar;q=0.9,en;q=0.8" → "ar").
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';')
      const qParam = params.find((p) => p.trim().startsWith('q='))
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1
      return {
        base: tag.trim().toLowerCase().split('-')[0] ?? '',
        q: Number.isNaN(q) ? 0 : q,
        index,
      }
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)

  return (
    (ranked.find((entry) => isLocale(entry.base))?.base as Locale | undefined) ?? DEFAULT_LOCALE
  )
}

/** Cookie wins (explicit user choice); otherwise negotiate from the browser's languages. */
export function resolveLocale(input: {
  cookie?: string | null
  acceptLanguage?: string | null
}): Locale {
  if (isLocale(input.cookie)) return input.cookie
  return negotiateLocale(input.acceptLanguage)
}

export function serializeLocaleCookie(locale: Locale, { secure }: { secure: boolean }): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure ? '; Secure' : ''}`
}

/** Reads the locale from a `document.cookie` string; null when absent or invalid. */
export function parseLocaleCookie(cookieHeader: string): Locale | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`))
  const value = match?.[1]
  return isLocale(value) ? value : null
}
