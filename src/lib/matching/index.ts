/**
 * The matching engine's public API. UI code, the search route and the seed script import from
 * here; the language pipelines (english.ts, arabic.ts) and config tables stay internal so their
 * shape can change without touching callers.
 */
export {
  isCanonicalName,
  normalizeIngredient,
  resolveIngredient,
  splitIngredientInput,
} from './normalize'
export { EXACT_WEIGHT, FAMILY_WEIGHT, rankRecipes, scoreRecipe } from './score'
export { compareResults, type RankedRecipe } from './sort'
export { classifyDiets, dietBlockers, type DietInput, type IngredientLine } from './dietClassifier'
export { FAMILIES, ancestorsOf, isFamilyMatch, parentOf } from './families'
export { STAPLES, isStaple } from './staples'
export { SYNONYMS, lookupSynonym } from './synonyms'
export type {
  MatchResult,
  RankOptions,
  ResolvedIngredient,
  ScorableRecipe,
  ScoreOptions,
  SortableRecipe,
} from './types'
