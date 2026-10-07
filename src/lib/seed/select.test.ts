import { describe, expect, it } from 'vitest'
import type { Diet, LocalRecipe } from '@/types/recipe'
import { CUISINE_LABELS } from './cuisines'
import {
  SEED_PLAN,
  rankScore,
  rejectionReason,
  selectRecipes,
  type Candidate,
  type SelectionPlan,
} from './select'

const VEGAN: Diet[] = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'pescatarian']
const VEGETARIAN: Diet[] = ['vegetarian', 'pescatarian']
const SEAFOOD: Diet[] = ['gluten-free', 'pescatarian']
const STEPS = [
  'Soften the onions in the oil for ten minutes, then add the spices and cook for one more.',
  'Add everything else, simmer for half an hour and season to taste before serving.',
]

interface Options {
  id?: string
  diets?: Diet[]
  category?: string
  source?: boolean
  /** Distinct non-staple ingredient names. */
  ingredients?: number
  instructions?: string[]
}

let nextId = 60_000

function recipe(cuisine: string, options: Options = {}): LocalRecipe {
  const mealDbId = options.id ?? String(nextId++)
  return {
    id: `local:${mealDbId}`,
    mealDbId,
    title: `Recipe ${mealDbId}`,
    imageUrl: `https://www.themealdb.com/images/media/meals/${mealDbId}.jpg`,
    category: options.category ?? 'Beef',
    cuisine,
    diets: options.diets ?? [],
    dietsEstimated: true,
    ingredients: Array.from({ length: options.ingredients ?? 4 }, (_, index) => ({
      raw: `1 item ${index}`,
      name: `item ${index}`,
    })),
    instructions: options.instructions ?? STEPS,
    ...(options.source ? { sourceUrl: `https://example.com/${mealDbId}` } : {}),
    attribution: 'TheMealDB',
  }
}

function candidate(cuisine: string, options: Options = {}, gaps: string[] = []): Candidate {
  return { recipe: recipe(cuisine, options), gaps }
}

const PLAN: SelectionPlan = {
  quotas: { Egyptian: 'all', British: 2 },
  required: [],
  relaxed: ['Egyptian'],
  excluded: {},
  gates: SEED_PLAN.gates,
  relaxedGates: SEED_PLAN.relaxedGates,
  targetTotal: 6,
  minTotal: 1,
  maxDessertShare: 0.5,
  maxDessertsPerCuisine: 1,
  targets: { vegetarian: 0, vegan: 0, seafood: 0, mena: 0 },
}

function plan(changes: Partial<SelectionPlan>): SelectionPlan {
  return { ...PLAN, ...changes }
}

function ids(recipes: readonly LocalRecipe[]): string[] {
  return recipes.map((item) => item.mealDbId)
}

describe('rankScore', () => {
  it.each([
    ['meat', {}, 0],
    ['seafood', { diets: SEAFOOD }, 4],
    ['vegan (also vegetarian)', { diets: VEGAN }, 5],
    ['vegetarian', { diets: VEGETARIAN }, 2],
    ['a source link', { source: true }, 1],
    [
      'a vegetarian dessert with a source',
      { diets: VEGETARIAN, category: 'Dessert', source: true },
      -2,
    ],
  ])('%s scores %i', (_, options, score) => {
    expect(rankScore(recipe('British', options))).toBe(score)
  })
})

describe('rejectionReason', () => {
  it('passes a complete recipe', () => {
    expect(rejectionReason(candidate('British'), SEED_PLAN.gates)).toBeUndefined()
  })

  it('rejects an incomplete ingredient list first', () => {
    const gaps = ['filed under Pork, but no ingredient line is pork']
    expect(rejectionReason(candidate('British', {}, gaps), SEED_PLAN.relaxedGates)).toBe(
      'ingredient list looks incomplete: filed under Pork, but no ingredient line is pork',
    )
  })

  it('counts distinct non-staple names only', () => {
    const base = recipe('British', { ingredients: 3 })
    const padded: LocalRecipe = {
      ...base,
      ingredients: [
        ...base.ingredients,
        { raw: '1 item 0', name: 'item 0' },
        { raw: 'Salt', name: 'salt' },
        { raw: 'Water', name: 'water' },
      ],
    }
    expect(rejectionReason({ recipe: padded, gaps: [] }, SEED_PLAN.gates)).toBe(
      '3 non-staple ingredients (needs 4)',
    )
  })

  it('rejects short or single-step instructions', () => {
    expect(
      rejectionReason(candidate('British', { instructions: ['Mix.', 'Bake.'] }), SEED_PLAN.gates),
    ).toBe('instructions are 10 characters (needs 120)')
    expect(
      rejectionReason(candidate('British', { instructions: [STEPS.join(' ')] }), SEED_PLAN.gates),
    ).toBe('1 step (needs 2)')
  })

  it('lets relaxed gates take an all-staple, one-step recipe', () => {
    const plain = candidate('Egyptian', { ingredients: 0, instructions: ['Knead and bake.'] })
    plain.recipe.ingredients = [{ raw: '4 cups Flour', name: 'flour' }]
    expect(rejectionReason(plain, SEED_PLAN.relaxedGates)).toBeUndefined()
    expect(rejectionReason(plain, SEED_PLAN.gates)).toBe('0 non-staple ingredients (needs 4)')
  })
})

describe('selectRecipes', () => {
  it('fills a quota best first, then by id, whatever the input order', () => {
    const meat = candidate('British', { id: '100' })
    const vegan = candidate('British', { id: '300', diets: VEGAN })
    const fish = candidate('British', { id: '200', diets: SEAFOOD })
    const fishToo = candidate('British', { id: '150', diets: SEAFOOD })
    const forward = selectRecipes([meat, vegan, fish, fishToo], PLAN)
    const backward = selectRecipes([fishToo, fish, vegan, meat], PLAN)
    expect(ids(forward.recipes)).toEqual(['300', '150'])
    expect(backward.recipes).toEqual(forward.recipes)
    expect(forward.shortfalls).toEqual([])
    expect(forward.problems).toEqual([])
  })

  it("takes every eligible recipe of an 'all' cuisine, with its relaxed gates", () => {
    const plain = candidate('Egyptian', { id: '10', ingredients: 1, instructions: ['Bake it.'] })
    const rich = candidate('Egyptian', { id: '11', diets: VEGAN })
    const incomplete = candidate('Egyptian', { id: '12' }, [
      'filed under Beef, but no ingredient line is beef',
    ])
    const selection = selectRecipes([plain, rich, incomplete], PLAN)
    expect(ids(selection.recipes)).toEqual(['11', '10'])
    expect(selection.rejected.map(({ recipe: item, reason }) => [item.mealDbId, reason])).toEqual([
      ['12', 'ingredient list looks incomplete: filed under Beef, but no ingredient line is beef'],
    ])
  })

  it('applies the normal gates outside relaxed cuisines', () => {
    const plain = candidate('British', { id: '20', ingredients: 1 })
    const selection = selectRecipes([plain], PLAN)
    expect(selection.recipes).toEqual([])
    expect(selection.shortfalls).toEqual(['British: 0 of 2'])
  })

  it('puts required recipes first and reports any it could not take', () => {
    const required = candidate('British', { id: '30' })
    const others = [
      candidate('British', { id: '31', diets: VEGAN }),
      candidate('British', { id: '32', diets: VEGAN }),
    ]
    const rejected = candidate('British', { id: '33', ingredients: 2 })
    const selection = selectRecipes(
      [...others, required, rejected],
      plan({ required: ['30', '33', '99'] }),
    )
    expect(ids(selection.recipes)).toEqual(['30', '31'])
    expect(selection.problems).toEqual([
      'required recipe 33 was not selected: 2 non-staple ingredients (needs 4)',
      'required recipe 99 was not selected: not among the candidates',
    ])
  })

  it('leaves out excluded recipes, saying why', () => {
    const excluded = candidate('British', { id: '40', diets: VEGAN })
    const kept = candidate('British', { id: '41' })
    const selection = selectRecipes(
      [excluded, kept],
      plan({ excluded: { '40': 'typo in the source' } }),
    )
    expect(ids(selection.recipes)).toEqual(['41'])
    expect(selection.rejected).toEqual([{ recipe: excluded.recipe, reason: 'typo in the source' }])
  })

  it('caps desserts per cuisine and overall, except for required recipes', () => {
    const desserts = ['50', '51', '52'].map((id) =>
      candidate('British', { id, category: 'Dessert', diets: VEGAN }),
    )
    // Vegan desserts with no source score 0, like the meat dish, and win the id tie-break.
    const meat = candidate('British', { id: '53' })
    expect(ids(selectRecipes([...desserts, meat], PLAN).recipes)).toEqual(['50', '53'])
    const required = selectRecipes([...desserts, meat], plan({ required: ['52'] }))
    expect(ids(required.recipes)).toEqual(['52', '53'])
    // The overall cap: floor(6 × 0.2) = 1 dessert in all, already taken by the British quota, so
    // the Greek dessert (vegan with a source: 1) loses to the Greek main course (0).
    const tight = plan({ maxDessertShare: 0.2, quotas: { British: 1, Greek: 1 } })
    const greek = candidate('Greek', { id: '54', category: 'Dessert', diets: VEGAN, source: true })
    const greekMain = candidate('Greek', { id: '55' })
    expect(ids(selectRecipes([desserts[0] as Candidate, greek, greekMain], tight).recipes)).toEqual(
      ['50', '55'],
    )
  })

  it("never caps an 'all' cuisine", () => {
    const desserts = ['60', '61', '62'].map((id) =>
      candidate('Egyptian', { id, category: 'Dessert' }),
    )
    expect(selectRecipes(desserts, PLAN).stats.desserts).toBe(3)
  })

  it('adds one recipe from each other cuisine, best first, up to the target total', () => {
    const quota = [candidate('British', { id: '70' }), candidate('British', { id: '71' })]
    const others = [
      candidate('Thai', { id: '72', diets: SEAFOOD }),
      candidate('Thai', { id: '73', diets: SEAFOOD }),
      candidate('Polish', { id: '74', diets: VEGAN }),
      candidate('Dutch', { id: '75' }),
      candidate('Cuban', { id: '76' }),
      candidate('Albanian', { id: '77' }),
    ]
    const selection = selectRecipes([...quota, ...others], PLAN)
    // Polish (5) and Thai (4) first, then the 0-score cuisines A–Z until 6 recipes.
    expect(ids(selection.recipes)).toEqual(['70', '71', '74', '72', '77', '76'])
    expect(selection.stats.cuisines).toEqual([
      ['British', 2],
      ['Albanian', 1],
      ['Cuban', 1],
      ['Polish', 1],
      ['Thai', 1],
    ])
  })

  it('reports a total outside the allowed range', () => {
    const selection = selectRecipes([candidate('British')], plan({ minTotal: 2 }))
    expect(selection.problems).toEqual(['1 recipes selected (needs 2–6)'])
    const crowded = plan({ quotas: { British: 7 }, targetTotal: 6 })
    const many = Array.from({ length: 7 }, () => candidate('British'))
    expect(selectRecipes(many, crowded).problems).toEqual(['7 recipes selected (needs 1–6)'])
  })

  it('reports every missed balance target', () => {
    const selection = selectRecipes(
      [candidate('British', { diets: VEGETARIAN }), candidate('British')],
      plan({ targets: { vegetarian: 0.5, vegan: 0.12, seafood: 0.15, mena: 1 } }),
    )
    expect(selection.problems).toEqual([
      'vegan: 0 recipes, 0.0% (needs ≥ 12.0%)',
      'seafood: 0 recipes, 0.0% (needs ≥ 15.0%)',
      'MENA: 0 recipes (needs ≥ 1)',
    ])
    expect(selectRecipes([], plan({ minTotal: 0 })).problems).toContain(
      'vegetarian: 0 recipes, 0.0% (needs ≥ 0.0%)',
    )
  })
})

describe('SEED_PLAN', () => {
  it('names only known cuisines', () => {
    for (const cuisine of [...Object.keys(SEED_PLAN.quotas), ...SEED_PLAN.relaxed]) {
      expect(CUISINE_LABELS).toContain(cuisine)
    }
  })

  it('relaxes only cuisines it takes in full', () => {
    for (const cuisine of SEED_PLAN.relaxed) expect(SEED_PLAN.quotas[cuisine]).toBe('all')
  })

  it('leaves room for one recipe from other cuisines, within the dataset limits', () => {
    const fixed = Object.values(SEED_PLAN.quotas).filter((quota) => typeof quota === 'number')
    expect(fixed.reduce((sum, quota) => sum + quota, 0)).toBeLessThan(SEED_PLAN.minTotal)
    expect(SEED_PLAN.minTotal).toBeGreaterThanOrEqual(190)
    expect(SEED_PLAN.targetTotal).toBeLessThanOrEqual(200)
  })

  it('requires the owner picks and excludes none of them', () => {
    expect(new Set(SEED_PLAN.required).size).toBe(SEED_PLAN.required.length)
    expect(SEED_PLAN.required).toEqual(
      expect.arrayContaining(['53215', '53219', '53222', '53226', '53358', '53359', '53251']),
    )
    for (const id of SEED_PLAN.required) expect(SEED_PLAN.excluded).not.toHaveProperty(id)
  })
})
