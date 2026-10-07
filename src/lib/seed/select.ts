import { isStaple } from '@/lib/matching'
import type { LocalRecipe } from '@/types/recipe'
import { DESSERT_CATEGORY, datasetStats, isSeafood, type DatasetStats } from './collection'
import type { SeedRecipe } from './transform'

/** A transformed meal: the recipe, plus whether its ingredient list looks incomplete. */
export type Candidate = Pick<SeedRecipe, 'recipe' | 'gaps'>

export interface QualityGates {
  /** Distinct non-staple ingredient names: fewer makes a poor match for any pantry. */
  minIngredients: number
  /** Characters across all steps. */
  minInstructionChars: number
  minSteps: number
}

export interface SelectionPlan {
  /** Cuisine → how many recipes, or 'all' that pass the gates. Filled in this order. */
  quotas: Readonly<Record<string, number | 'all'>>
  /** TheMealDB ids the owner asked for by name: always first in their cuisine, never capped. */
  required: readonly string[]
  /** Cuisines held to `relaxedGates`: the owner wants every one of their recipes. */
  relaxed: readonly string[]
  /** TheMealDB id → why it is left out: source errors the gates cannot see. */
  excluded: Readonly<Record<string, string>>
  gates: QualityGates
  relaxedGates: QualityGates
  /** After the quotas, one recipe from each other cuisine, best first, up to this many in all. */
  targetTotal: number
  minTotal: number
  /** Share of targetTotal that may be desserts, and the most desserts one cuisine may add. */
  maxDessertShare: number
  maxDessertsPerCuisine: number
  /** Diet balance: shares of the selection, except `mena`, a recipe count. */
  targets: { vegetarian: number; vegan: number; seafood: number; mena: number }
}

/** The owner's quotas (docs/PLAN.md, "Local dataset quotas"). */
export const SEED_PLAN: SelectionPlan = {
  quotas: {
    Egyptian: 'all',
    'Saudi Arabian': 'all',
    Arabian: 'all',
    British: 20,
    American: 15,
    Italian: 18,
    French: 15,
    Spanish: 15,
    Chinese: 15,
    Mexican: 'all',
    Turkish: 12,
    Algerian: 6,
    Tunisian: 6,
    Moroccan: 6,
    Syrian: 5,
    Greek: 5,
    Afghan: 3,
  },
  required: [
    // Saudi: the three shakshuka variants and Shawarma bread.
    '53215',
    '53219',
    '53222',
    '53226',
    // Chicken and Beef Mandi (relabelled Arabian) and Turkish lahmacun (filed under Vietnam).
    '53358',
    '53359',
    '53251',
  ],
  relaxed: ['Egyptian', 'Saudi Arabian', 'Arabian'],
  excluded: {
    '52849':
      'lists "Cannellini Beans" where the dish needs cannelloni tubes, so it would match beans ' +
      'and be tagged gluten-free',
  },
  gates: { minIngredients: 4, minInstructionChars: 120, minSteps: 2 },
  // Feteer Meshaltet lists only staples (flour, water, salt, butter, oil) and is still wanted.
  relaxedGates: { minIngredients: 0, minInstructionChars: 0, minSteps: 1 },
  targetTotal: 195,
  minTotal: 190,
  maxDessertShare: 0.1,
  maxDessertsPerCuisine: 4,
  targets: { vegetarian: 0.35, vegan: 0.12, seafood: 0.15, mena: 40 },
}

export interface Selection {
  /** Quota cuisines in plan order, each best first, then one recipe per other cuisine. */
  recipes: LocalRecipe[]
  stats: DatasetStats
  /** Candidates that failed a quality gate, and why. */
  rejected: Array<{ recipe: LocalRecipe; reason: string }>
  /** Numeric quotas that had too few eligible recipes, e.g. "Syrian: 4 of 5". */
  shortfalls: string[]
  /** Broken rules (a required recipe missing, total out of range, a missed target): do not use. */
  problems: string[]
}

/**
 * Within-cuisine preference: seafood +4, vegan +3, vegetarian +2 (a vegan recipe gets both),
 * a source link +1, dessert −5. Weighted towards what the diet balance targets need most.
 */
export function rankScore(recipe: LocalRecipe): number {
  let score = 0
  if (isSeafood(recipe)) score += 4
  if (recipe.diets.includes('vegan')) score += 3
  if (recipe.diets.includes('vegetarian')) score += 2
  if (recipe.sourceUrl !== undefined) score += 1
  if (recipe.category === DESSERT_CATEGORY) score -= 5
  return score
}

/** Why a candidate cannot be selected, or undefined when it passes every gate. */
export function rejectionReason(candidate: Candidate, gates: QualityGates): string | undefined {
  const { recipe, gaps } = candidate
  if (gaps.length > 0) return `ingredient list looks incomplete: ${gaps.join('; ')}`
  const names = new Set(recipe.ingredients.map((ingredient) => ingredient.name))
  const ingredients = [...names].filter((name) => !isStaple(name)).length
  if (ingredients < gates.minIngredients) {
    return `${ingredients} non-staple ingredients (needs ${gates.minIngredients})`
  }
  const chars = recipe.instructions.join(' ').length
  if (chars < gates.minInstructionChars) {
    return `instructions are ${chars} characters (needs ${gates.minInstructionChars})`
  }
  if (recipe.instructions.length < gates.minSteps) {
    return `${recipe.instructions.length} step (needs ${gates.minSteps})`
  }
  return undefined
}

function percent(share: number): string {
  return `${(share * 100).toFixed(1)}%`
}

function missedTargets(stats: DatasetStats, targets: SelectionPlan['targets']): string[] {
  const { total } = stats
  const shares: Array<[string, number, number]> = [
    ['vegetarian', stats.diets.vegetarian, targets.vegetarian],
    ['vegan', stats.diets.vegan, targets.vegan],
    ['seafood', stats.seafood, targets.seafood],
  ]
  const missed = shares
    .filter(([, count, target]) => total === 0 || count / total < target)
    .map(([label, count, target]) => {
      return `${label}: ${count} recipes, ${percent(total === 0 ? 0 : count / total)} (needs ≥ ${percent(target)})`
    })
  if (stats.mena < targets.mena)
    missed.push(`MENA: ${stats.mena} recipes (needs ≥ ${targets.mena})`)
  return missed
}

/**
 * Picks the local dataset from every transformed TheMealDB meal. Deterministic: candidates are
 * ranked by rankScore, then by id, never at random, so the same API data gives the same list.
 * Quotas are filled in plan order; desserts are skipped once their cuisine or the whole selection
 * reaches its cap ('all' quotas and required recipes are never capped, but still count).
 */
export function selectRecipes(
  candidates: readonly Candidate[],
  plan: SelectionPlan = SEED_PLAN,
): Selection {
  const required = new Set(plan.required)
  const relaxed = new Set(plan.relaxed)
  const rejected: Selection['rejected'] = []
  const byCuisine = new Map<string, LocalRecipe[]>()
  for (const candidate of candidates) {
    const { recipe } = candidate
    const reason =
      plan.excluded[recipe.mealDbId] ??
      rejectionReason(candidate, relaxed.has(recipe.cuisine) ? plan.relaxedGates : plan.gates)
    if (reason !== undefined) rejected.push({ recipe, reason })
    else byCuisine.set(recipe.cuisine, [...(byCuisine.get(recipe.cuisine) ?? []), recipe])
  }
  const isRequired = (recipe: LocalRecipe) => required.has(recipe.mealDbId)
  for (const list of byCuisine.values()) {
    list.sort(
      (a, b) =>
        Number(isRequired(b)) - Number(isRequired(a)) ||
        rankScore(b) - rankScore(a) ||
        Number(a.mealDbId) - Number(b.mealDbId),
    )
  }

  const selected: LocalRecipe[] = []
  const maxDesserts = Math.floor(plan.targetTotal * plan.maxDessertShare)
  let desserts = 0
  const take = (cuisine: string, quota: number | 'all'): number => {
    let taken = 0
    let cuisineDesserts = 0
    for (const recipe of byCuisine.get(cuisine) ?? []) {
      if (quota !== 'all' && taken >= quota) break
      const dessert = recipe.category === DESSERT_CATEGORY
      const capped =
        quota !== 'all' &&
        !isRequired(recipe) &&
        (desserts >= maxDesserts || cuisineDesserts >= plan.maxDessertsPerCuisine)
      if (dessert && capped) continue
      selected.push(recipe)
      taken++
      if (dessert) {
        desserts++
        cuisineDesserts++
      }
    }
    return taken
  }

  const shortfalls: string[] = []
  for (const [cuisine, quota] of Object.entries(plan.quotas)) {
    const taken = take(cuisine, quota)
    if (quota !== 'all' && taken < quota) shortfalls.push(`${cuisine}: ${taken} of ${quota}`)
  }
  const others = [...byCuisine]
    .filter(([cuisine]) => !Object.hasOwn(plan.quotas, cuisine))
    .map(([cuisine, ranked]) => ({ cuisine, best: rankScore(ranked[0] as LocalRecipe) }))
    .sort((a, b) => b.best - a.best || a.cuisine.localeCompare(b.cuisine))
  for (const { cuisine } of others) {
    if (selected.length >= plan.targetTotal) break
    take(cuisine, 1)
  }

  const problems: string[] = []
  const chosen = new Set(selected.map((recipe) => recipe.mealDbId))
  for (const id of plan.required) {
    if (chosen.has(id)) continue
    const reason = rejected.find(({ recipe }) => recipe.mealDbId === id)?.reason
    problems.push(`required recipe ${id} was not selected: ${reason ?? 'not among the candidates'}`)
  }
  if (selected.length < plan.minTotal || selected.length > plan.targetTotal) {
    problems.push(
      `${selected.length} recipes selected (needs ${plan.minTotal}–${plan.targetTotal})`,
    )
  }
  const stats = datasetStats(selected)
  problems.push(...missedTargets(stats, plan.targets))
  return { recipes: selected, stats, rejected, shortfalls, problems }
}
