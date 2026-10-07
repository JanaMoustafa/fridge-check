/**
 * Everything the ingredient input needs from the matching engine, bundled as one module that the
 * browser loads on first interaction (dynamic import), so it stays out of the initial page JS.
 */
import { arabicAliasEntries } from '@/lib/matching/arabic'
import { resolveIngredient, splitIngredientInput } from '@/lib/matching/normalize'
import { CANONICAL_NAMES, SYNONYMS } from '@/lib/matching/synonyms'
import { buildSuggestionIndex, suggest, type SuggestionIndex } from './suggest'

export { resolveIngredient, splitIngredientInput, suggest }

/** True for ingredients the app knows (and so can match); typos and unknown words are false. */
export function isKnownIngredient(canonical: string): boolean {
  return CANONICAL_NAMES.has(canonical)
}

/** Every way to type an ingredient: canonical names, English synonyms, Arabic aliases and names. */
export function buildIngredientIndex(
  arabicNames: Readonly<Record<string, string>> = {},
): SuggestionIndex {
  const phrases = new Map<string, string[]>()
  const add = (canonical: string, phrase: string) => {
    const list = phrases.get(canonical)
    if (list) list.push(phrase)
    else phrases.set(canonical, [phrase])
  }
  for (const canonical of CANONICAL_NAMES) add(canonical, canonical)
  for (const [alias, canonical] of Object.entries(SYNONYMS)) add(canonical, alias)
  for (const [phrase, canonical] of arabicAliasEntries()) add(canonical, phrase)
  for (const [canonical, arabic] of Object.entries(arabicNames)) add(canonical, arabic)
  return buildSuggestionIndex(
    [...phrases].map(([canonical, list]) => ({ canonical, phrases: list })),
  )
}
