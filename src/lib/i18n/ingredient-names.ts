import type { Locale } from '@/lib/i18n/locale'

/** Canonical ingredient name → Arabic display name (data/i18n/ingredients.ar.json). */
export type IngredientNameTable = Readonly<Record<string, string>>

/**
 * Display label for a canonical ingredient. English shows the canonical name in sentence case;
 * Arabic uses the reviewed table and falls back to English for anything not yet translated.
 */
export function ingredientLabel(
  canonical: string,
  locale: Locale,
  arabicNames?: IngredientNameTable,
): string {
  if (locale === 'ar') {
    const arabic = arabicNames?.[canonical]
    if (arabic) return arabic
  }
  return canonical.charAt(0).toUpperCase() + canonical.slice(1)
}

/** Code-split: the table (~600 names) is only downloaded when the UI is in Arabic. */
export async function loadArabicIngredientNames(): Promise<IngredientNameTable> {
  const table = await import('../../../data/i18n/ingredients.ar.json')
  return table.default
}
