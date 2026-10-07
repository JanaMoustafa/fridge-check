import { isFamilyMatch } from './families'
import { compareResults } from './sort'
import { isStaple } from './staples'
import type {
  MatchResult,
  RankOptions,
  ScorableRecipe,
  ScoreOptions,
  SortableRecipe,
} from './types'

/** Weight of a recipe ingredient the user has exactly. */
export const EXACT_WEIGHT = 1
/** Weight of a family hit: chicken breast for chicken (or the reverse) works, but not perfectly. */
export const FAMILY_WEIGHT = 0.8

const DEFAULT_OPTIONS: ScoreOptions = { assumeStaples: true }

/** Which user ingredients cover a recipe ingredient, and for what weight. */
interface Coverage {
  /** Every user item that covers the line: the line itself first, then its relatives A–Z. */
  users: readonly string[]
  weight: number
}

/** While staples are assumed they are invisible on both sides: never used, missing or credited. */
function isIgnored(name: string, options: ScoreOptions): boolean {
  return options.assumeStaples && isStaple(name)
}

/**
 * Resolves recipe ingredients against one user list. Ranking scores hundreds of recipes that
 * share the same few hundred names, so each name is resolved once per ranking, not per recipe.
 */
interface Matcher {
  users: readonly string[]
  cover: (name: string) => Coverage | undefined
}

function createMatcher(userIngredients: readonly string[], options: ScoreOptions): Matcher {
  // A typed staple would otherwise still cover its relatives (sugar → brown sugar, butter → ghee).
  const users = [...new Set(userIngredients)].filter((user) => !isIgnored(user, options))
  const exact = new Set(users)
  // Sorted, so which item gets credited never depends on the order the chips were added in.
  const byName = [...users].sort()
  const cache = new Map<string, Coverage | undefined>()

  // Exact beats family: the user's own item earns the full weight and is offered credit first.
  const resolve = (name: string): Coverage | undefined => {
    const relatives = byName.filter((user) => isFamilyMatch(user, name))
    if (exact.has(name)) return { users: [name, ...relatives], weight: EXACT_WEIGHT }
    return relatives.length === 0 ? undefined : { users: relatives, weight: FAMILY_WEIGHT }
  }

  return {
    users,
    cover(name) {
      if (!cache.has(name)) cache.set(name, resolve(name))
      return cache.get(name)
    },
  }
}

/**
 * The user items a recipe credits ("Uses N of your ingredients"): a maximum matching between the
 * used lines and the items that cover them. One line credits at most one item, so three chicken
 * cuts count once for a single "chicken" line, and the count is as high as it can be, so beef and
 * steak both count for ground beef and sirloin steak whichever chip came first.
 */
function creditedUsers(lines: readonly Coverage[]): Set<string> {
  const lineOf = new Map<string, Coverage>()
  // Kuhn's augmenting path: give the line a free item, or move an item's earlier line to another.
  const claim = (line: Coverage, tried: Set<string>): boolean =>
    line.users.some((user) => {
      if (tried.has(user)) return false
      tried.add(user)
      const held = lineOf.get(user)
      if (held !== undefined && !claim(held, tried)) return false
      lineOf.set(user, line)
      return true
    })
  for (const line of lines) claim(line, new Set())
  return new Set(lineOf.keys())
}

/** Σ weights / N, rounded to 4 decimals so float noise (0.8 × 3) never splits a sort tie. */
function roundScore(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

function scoreWith(matcher: Matcher, recipe: ScorableRecipe, options: ScoreOptions): MatchResult {
  const names = new Set<string>()
  for (const ingredient of recipe.ingredients) {
    if (!isIgnored(ingredient.name, options)) names.add(ingredient.name)
  }

  const usedIngredients: string[] = []
  const missingIngredients: string[] = []
  const covered: Coverage[] = []
  let total = 0
  for (const name of names) {
    const coverage = matcher.cover(name)
    if (coverage === undefined) {
      missingIngredients.push(name)
    } else {
      usedIngredients.push(name)
      covered.push(coverage)
      total += coverage.weight
    }
  }
  const credited = creditedUsers(covered)

  return {
    usedIngredients,
    missingIngredients,
    matchedUserIngredients: matcher.users.filter((user) => credited.has(user)),
    matchScore: names.size === 0 ? 0 : roundScore(total / names.size),
  }
}

/**
 * Scores one recipe against the user's canonical ingredients. Recipe names are deduplicated (a
 * recipe listing onion twice needs one onion) and, with assumeStaples on, staples are neither used
 * nor missing, and a staple the user typed covers nothing. A recipe with nothing left to score
 * gets 0. The result does not depend on the order of the user's ingredients, except that
 * matchedUserIngredients lists them in that order.
 */
export function scoreRecipe(
  userIngredients: readonly string[],
  recipe: ScorableRecipe,
  options: ScoreOptions = DEFAULT_OPTIONS,
): MatchResult {
  return scoreWith(createMatcher(userIngredients, options), recipe, options)
}

/**
 * Scores, filters and sorts recipes. Recipes that use none of the user's ingredients are dropped
 * (spec). Each result is a copy of the recipe with fresh match fields that replace any a provider
 * sent, so every source is ranked by the same rules.
 */
export function rankRecipes<T extends SortableRecipe>(
  userIngredients: readonly string[],
  recipes: readonly T[],
  options: RankOptions,
): Array<T & MatchResult> {
  const matcher = createMatcher(userIngredients, options)
  const ranked: Array<T & MatchResult> = []
  for (const recipe of recipes) {
    const result = scoreWith(matcher, recipe, options)
    if (result.usedIngredients.length > 0) ranked.push({ ...recipe, ...result })
  }
  return ranked.sort(compareResults(options.sort))
}
