import 'server-only'
import type { Locale } from '@/lib/i18n/locale'
import { loadArabicIngredientNames, type IngredientNameTable } from './ingredient-names'

/** The Arabic names table for server-rendered pages: only sent to the browser in Arabic. */
export async function arabicIngredientNamesFor(
  locale: Locale,
): Promise<IngredientNameTable | undefined> {
  return locale === 'ar' ? loadArabicIngredientNames() : undefined
}
