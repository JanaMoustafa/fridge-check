import { describe, expect, it } from 'vitest'
import { findDataProblems } from './validate-data'

const recipe = (id: number, patch: Record<string, unknown> = {}) => ({
  id: `local:${id}`,
  mealDbId: String(id),
  title: `Recipe ${id}`,
  imageUrl: 'https://www.themealdb.com/images/media/meals/x.jpg',
  category: 'Vegetarian',
  cuisine: 'Egyptian',
  diets: ['vegetarian', 'pescatarian'],
  dietsEstimated: false,
  ingredients: [{ raw: '1 cup Lentils', name: 'lentil' }],
  instructions: ['Cook the lentils.'],
  attribution: 'TheMealDB',
  ...patch,
})

function files(recipes = Array.from({ length: 150 }, (_, i) => recipe(1000 + i))) {
  return {
    recipes: { version: 1, recipes },
    dietOverrides: {
      version: 1,
      recipes: Object.fromEntries(
        recipes.map((r) => [r.mealDbId, { title: r.title, diets: r.diets }]),
      ),
    },
    arabicNames: { lentil: 'عدس' },
    fdcMapping: {
      version: 1,
      foods: {
        lentil: { fdcId: 172420, description: 'Lentils, raw' },
        sumac: { fdcId: null, reason: 'No FDC food', minor: true },
      },
    },
    nutritionFoods: {
      version: 1,
      source: 'USDA FoodData Central',
      foods: {
        lentil: {
          fdcId: 172420,
          description: 'Lentils, raw',
          dataType: 'SR Legacy',
          per100g: { kcal: 352, proteinG: 24.6, fatG: 1.1, carbsG: 63.4 },
          portions: { cup: 192 },
        },
      },
      minorWithoutFood: ['sumac'],
    },
  }
}

describe('findDataProblems', () => {
  it('accepts a valid, reviewed, translated collection', () => {
    expect(findDataProblems(files())).toEqual([])
  })

  it('reports schema errors (e.g. too few recipes)', () => {
    const problems = findDataProblems(files([recipe(1)]))
    expect(problems[0]?.problem).toMatch(/recipes/)
  })

  it('reports unreviewed diets, non-canonical names and missing Arabic names', () => {
    const recipes = Array.from({ length: 150 }, (_, i) => recipe(1000 + i))
    recipes[0] = recipe(1000, { dietsEstimated: true })
    recipes[1] = recipe(1001, { ingredients: [{ raw: '2 Tomatoes', name: 'tomatoes' }] })
    recipes[2] = recipe(1002, { ingredients: [{ raw: '1 Onion', name: 'onion' }] })
    const problems = findDataProblems(files(recipes)).map((p) => p.problem)
    expect(problems).toContain('diet tags not reviewed')
    expect(problems).toContain('ingredient "tomatoes" is not canonical')
    expect(problems).toContain('ingredient "onion" has no Arabic name')
  })

  it('reports duplicate ids and a malformed overrides file', () => {
    const recipes = Array.from({ length: 150 }, (_, i) => recipe(1000 + i))
    recipes[149] = recipe(1000)
    expect(findDataProblems(files(recipes)).map((p) => p.problem)).toContain('duplicate id')
    expect(findDataProblems({ ...files(), dietOverrides: { version: 2 } })[0]?.problem).toMatch(
      /diet-overrides\.json/,
    )
  })
  it('reports ingredients with no nutrition mapping, and a stale foods.json', () => {
    const recipes = Array.from({ length: 150 }, (_, i) => recipe(1000 + i))
    recipes[0] = recipe(1000, { ingredients: [{ raw: '1 Onion', name: 'onion' }] })
    const base = files(recipes)
    const problems = findDataProblems({
      ...base,
      arabicNames: { lentil: 'عدس', onion: 'بصل' },
    }).map((p) => p.problem)
    expect(problems).toEqual(['ingredient "onion" has no entry in nutrition/fdc-mapping.json'])

    const changedId = structuredClone(files())
    changedId.fdcMapping.foods.lentil.fdcId = 999
    expect(findDataProblems(changedId).map((p) => p.problem)).toEqual([
      'nutrition/foods.json is out of date for "lentil" (run pnpm seed:nutrition)',
    ])

    const minorChanged = structuredClone(files())
    minorChanged.nutritionFoods.minorWithoutFood = []
    expect(findDataProblems(minorChanged).map((p) => p.problem)).toEqual([
      'nutrition/foods.json is out of date for "sumac" (run pnpm seed:nutrition)',
    ])

    const extra = structuredClone(files())
    ;(extra.nutritionFoods.foods as Record<string, unknown>).leek =
      extra.nutritionFoods.foods.lentil
    expect(findDataProblems(extra).map((p) => p.problem)).toEqual([
      'nutrition/foods.json is out of date for "leek" (run pnpm seed:nutrition)',
    ])
  })

  it('reports malformed nutrition files', () => {
    expect(findDataProblems({ ...files(), fdcMapping: { version: 2 } })[0]?.problem).toMatch(
      /fdc-mapping\.json/,
    )
    expect(findDataProblems({ ...files(), nutritionFoods: {} })[0]?.problem).toMatch(/foods\.json/)
  })
})
