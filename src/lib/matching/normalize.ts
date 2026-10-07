import { isCanonicalName } from './canonical'
import { foldArabic, hasArabic, normalizeArabicIngredient } from './arabic'
import { normalizeEnglishIngredient } from './english'
import type { ResolvedIngredient } from './types'

/**
 * List separators in pasted text: newlines, the ASCII and Arabic commas and semicolons. An ASCII
 * comma between two digits (Western or Arabic-Indic) is a decimal or thousands separator
 * ("1,5 kg flour"), as in the English pipeline, so it does not split. "and" / "و" never split:
 * "salt and pepper" and "ملح وفلفل" are one line each.
 */
const DIGIT = '[0-9\\u0660-\\u0669\\u06F0-\\u06F9]'
const LIST_SEPARATOR = new RegExp(
  `\\r\\n|[\\r\\n;\\u060C\\u061B]|(?<!${DIGIT}),|,(?!${DIGIT})`,
  'u',
)

export { isCanonicalName }

/**
 * Raw ingredient text in either language → canonical English name. Arabic text the alias table
 * does not know comes back folded but not canonical, so callers must check isCanonicalName (or
 * use resolveIngredient) before treating the result as an ID.
 */
export function normalizeIngredient(raw: string): string {
  if (!hasArabic(raw)) return normalizeEnglishIngredient(raw)
  const arabic = normalizeArabicIngredient(raw)
  if (arabic !== null) return arabic
  const folded = foldArabic(raw)
  // Arabic-keyboard digits or punctuation around English words ("٢ tomatoes", "tomato،") count
  // as Arabic, but once folded no Arabic letter is left: the text is English after all.
  return hasArabic(folded) ? folded : normalizeEnglishIngredient(folded)
}

/** One piece of user input → a chip: the canonical ID, or null when it cannot become one. */
export function resolveIngredient(raw: string): ResolvedIngredient {
  const input = raw.trim()
  const normalized = input === '' ? '' : normalizeIngredient(input)
  const canonical = isCanonicalName(normalized) ? normalized : null
  return { input, canonical, changed: canonical !== null && canonical !== input.toLowerCase() }
}

/**
 * Pasted text → one entry per ingredient, trimmed, empties dropped, in order. Duplicates are kept
 * on purpose: two spellings can resolve to the same name, so the UI dedupes after normalizing.
 */
export function splitIngredientInput(text: string): string[] {
  return text
    .split(LIST_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part !== '')
}
