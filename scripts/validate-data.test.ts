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
})
