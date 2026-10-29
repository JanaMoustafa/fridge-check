import type { Locale } from '@/lib/i18n/locale'
import type { Bilingual } from './types'

/** The library's text in the reader's language. */
export function say(text: Bilingual, locale: Locale): string {
  return text[locale]
}

/** Weekday names, Sunday first: "Sun"/"Sunday", "الأحد". */
export function weekdayNames(locale: Locale, width: 'short' | 'long'): string[] {
  const format = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    weekday: width,
    timeZone: 'UTC',
  })
  // 1 November 2026 is a Sunday.
  return Array.from({ length: 7 }, (_, day) => format.format(new Date(Date.UTC(2026, 10, 1 + day))))
}
