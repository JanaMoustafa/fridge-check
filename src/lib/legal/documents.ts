import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/locale'
import type { LegalDocument, LegalPage } from './document'
import { privacyPolicy } from './privacy'
import { refundPolicy } from './refunds'
import { termsOfUse } from './terms'

export const LEGAL_DOCUMENTS: Record<LegalPage, Record<Locale, LegalDocument>> = {
  privacy: privacyPolicy,
  terms: termsOfUse,
  refunds: refundPolicy,
}

/** One legal page in the reader's language (English for anything unexpected). */
export function legalDocument(page: LegalPage, locale: string): LegalDocument {
  return LEGAL_DOCUMENTS[page][isLocale(locale) ? locale : DEFAULT_LOCALE]
}
