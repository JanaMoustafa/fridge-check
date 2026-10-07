import { foldArabic, hasArabic } from '@/lib/matching/arabic'

/** One searchable phrase (an English name or synonym, an Arabic name or alias) for an ingredient. */
export interface SuggestionTerm {
  canonical: string
  term: string
}

export interface SuggestionIndex {
  terms: readonly SuggestionTerm[]
}

/** Lowercase, accent- and Arabic-folded, single-spaced: the form both sides are compared in. */
export function foldForSearch(text: string): string {
  const folded = hasArabic(text) ? foldArabic(text) : text
  return folded
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}' ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildSuggestionIndex(
  entries: Iterable<{ canonical: string; phrases: Iterable<string> }>,
): SuggestionIndex {
  const seen = new Set<string>()
  const terms: SuggestionTerm[] = []
  for (const { canonical, phrases } of entries) {
    for (const phrase of phrases) {
      const term = foldForSearch(phrase)
      const key = `${canonical}\u0000${term}`
      if (term && !seen.has(key)) {
        seen.add(key)
        terms.push({ canonical, term })
      }
    }
  }
  return { terms }
}

/** True when `a` and `b` differ by at most one edit (insert, delete, substitute or swap). */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
  }
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a]
  return longer.slice(i + 1) === shorter.slice(i)
}

function isSubsequence(query: string, term: string): boolean {
  let position = 0
  for (const char of term) if (char === query[position]) position++
  return position === query.length
}

/** Higher is better; 0 means no match. */
export function scoreTerm(query: string, term: string): number {
  if (term === query) return 100
  if (term.startsWith(query)) return 90 - Math.min(term.length - query.length, 20) / 2
  const words = term.split(' ')
  if (words.some((word) => word.startsWith(query))) return 70
  if (term.includes(query)) return 55
  if (query.length >= 4) {
    // A typo in what has been typed so far: compare against the term's prefix of the same length.
    if (withinOneEdit(query, term.slice(0, query.length))) return 45
    if (words.some((word) => withinOneEdit(query, word))) return 40
  }
  if (query.length >= 3 && isSubsequence(query, term)) return 15
  return 0
}

/**
 * Best-matching ingredients for what the user is typing (debounced by the caller). One entry per
 * ingredient, best score first; ties prefer the shorter term, then alphabetical order.
 */
export function suggest(
  index: SuggestionIndex,
  input: string,
  {
    limit = 8,
    exclude = new Set<string>(),
  }: { limit?: number; exclude?: ReadonlySet<string> } = {},
): string[] {
  const query = foldForSearch(input)
  if (!query) return []
  const best = new Map<string, { score: number; length: number }>()
  for (const { canonical, term } of index.terms) {
    if (exclude.has(canonical)) continue
    const score = scoreTerm(query, term)
    if (score === 0) continue
    const current = best.get(canonical)
    if (
      !current ||
      score > current.score ||
      (score === current.score && term.length < current.length)
    ) {
      best.set(canonical, { score, length: term.length })
    }
  }
  return [...best]
    .sort(([a, x], [b, y]) => y.score - x.score || x.length - y.length || (a < b ? -1 : 1))
    .slice(0, limit)
    .map(([canonical]) => canonical)
}
