import type messages from '../../messages/en.json'
import type { formats } from '@/lib/i18n/formats'
import type { Locale } from '@/lib/i18n/locale'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: typeof messages
    Formats: typeof formats
  }
}
