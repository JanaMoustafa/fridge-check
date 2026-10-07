import type { SortKey } from '@/types/recipe'
import type { MatchResult, SortableRecipe } from './types'

/** A scored recipe as the sorter sees it. */
export type RankedRecipe = SortableRecipe & MatchResult

type Comparator = (a: RankedRecipe, b: RankedRecipe) => number

const byFewestMissing: Comparator = (a, b) =>
  a.missingIngredients.length - b.missingIngredients.length

const byHighestScore: Comparator = (a, b) => b.matchScore - a.matchScore

/** "Uses N of your ingredients": the count the card shows, the same for any chip order. */
const byMostMatched: Comparator = (a, b) =>
  b.matchedUserIngredients.length - a.matchedUserIngredients.length

/** Unknown cook times sort last: TheMealDB has none, and a guess would mislead "Quickest". */
const byQuickest: Comparator = (a, b) => {
  const left = a.readyInMinutes
  const right = b.readyInMinutes
  if (left === right) return 0
  if (left === undefined) return 1
  if (right === undefined) return -1
  return left - right
}

// One shared collator: far cheaper than localeCompare(…, 'en') per comparison, same ordering.
const titleCollator = new Intl.Collator('en')

/**
 * Final tie-break, so every provider returns the same order for the same results. Titles the
 * collator calls equal but that differ in code units (é vs e + combining accent) are split by code
 * unit, which leaves 0 only for identical titles, where Array#sort stability keeps input order.
 */
const byTitle: Comparator = (a, b) => {
  const collated = titleCollator.compare(a.title, b.title)
  if (collated !== 0) return collated
  if (a.title === b.title) return 0
  return a.title < b.title ? -1 : 1
}

/** Comparator chains, most significant first. `fewest-missing` is the spec's default ordering. */
const CHAINS = {
  'fewest-missing': [byFewestMissing, byHighestScore, byMostMatched, byQuickest, byTitle],
  best: [byHighestScore, byFewestMissing, byMostMatched, byQuickest, byTitle],
  quickest: [byQuickest, byFewestMissing, byHighestScore, byMostMatched, byTitle],
} as const satisfies Record<SortKey, readonly Comparator[]>

/** Comparator for Array#sort: a total order over scored recipes for the given sort key. */
export function compareResults(sort: SortKey): Comparator {
  const chain: readonly Comparator[] = CHAINS[sort]
  return (a, b) => {
    for (const compare of chain) {
      const order = compare(a, b)
      if (order !== 0) return order
    }
    return 0
  }
}
