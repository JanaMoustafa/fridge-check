import type { SortKey } from '@/types/recipe'

/** Anything the engine can score: only canonical ingredient names are needed. */
export interface ScorableRecipe {
  ingredients: ReadonlyArray<{ name: string }>
}

/** Optional fields the sorter uses (cook time, title for a stable tie-break). */
export interface SortableRecipe extends ScorableRecipe {
  title: string
  readyInMinutes?: number
}

export interface ScoreOptions {
  /** "Assume I have basic staples" (default ON): staples are never used or missing. */
  assumeStaples: boolean
}

export interface MatchResult {
  /** Recipe-side canonical names matched by the user's ingredients (exact or family). */
  usedIngredients: string[]
  /** Recipe-side canonical names not matched (staples excluded when assumeStaples is on). */
  missingIngredients: string[]
  /**
   * The user's items the recipe uses ("Uses N of your ingredients"), in the user's order: a
   * maximum matching of user items to the used ingredients they cover, so each recipe ingredient
   * credits at most one item. Neither the count nor the items depend on the order of the chips.
   * Typed staples are never credited while assumeStaples is on.
   */
  matchedUserIngredients: string[]
  /** Σ weights / N over deduplicated non-staple recipe ingredients (exact 1.0, family 0.8). */
  matchScore: number
}

export interface RankOptions extends ScoreOptions {
  sort: SortKey
}

/** Result of resolving one piece of user input into a chip. */
export interface ResolvedIngredient {
  /** What the user typed, trimmed. */
  input: string
  /** Canonical English name, or null when the input is not recognised (e.g. unknown Arabic). */
  canonical: string | null
  /** True when normalization changed the text (the chip shows the original in a tooltip). */
  changed: boolean
}
