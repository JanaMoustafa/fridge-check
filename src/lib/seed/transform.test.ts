import { describe, expect, it } from 'vitest'
import { LocalRecipeSchema } from '@/types/recipe'
import fixture from '../../../tests/fixtures/mealdb-meals.sample.json'
import type { CuisineOverrides, DietOverrides } from './data-files'
import { MealDbMealSchema, parseMealsField, type MealDbMeal } from './mealdb-schema'
import {
  ATTRIBUTION,
  ingredientName,
  measureModifier,
  toLocalRecipe,
  type SeedOverrides,
} from './transform'

const MEALS = parseMealsField(fixture, MealDbMealSchema).items
const NO_OVERRIDES: SeedOverrides = { dietOverrides: {}, cuisineOverrides: {} }

function meal(id: string): MealDbMeal {
  const found = MEALS.find((candidate) => candidate.idMeal === id)
  if (found === undefined) throw new Error(`fixture has no meal ${id}`)
  return found
}

function seed(id: string, overrides: Partial<SeedOverrides> = {}) {
  return toLocalRecipe(meal(id), { ...NO_OVERRIDES, ...overrides })
}

/** A fixture meal with fields replaced, for the failure cases real data does not show. */
function seedEdited(id: string, edits: Partial<MealDbMeal>) {
  return toLocalRecipe({ ...meal(id), ...edits }, NO_OVERRIDES)
}

describe('measureModifier', () => {
  it.each([
    ['2 tsp ground', 'ground'],
    ['1 red', 'red'],
    ['Ground', 'Ground'],
    ['1 Yolk', 'Yolk'],
    ['1 small finely diced', 'small finely diced'],
    ['Juice of 1', 'Juice of'],
    ['50g/1¾oz', ''],
    ['1 (400g) tin', ''],
    ['3 cloves', ''],
    ['1 ½ tsp', ''],
    ['Sprinking', ''],
    ['', ''],
  ])('%j → %j', (measure, modifier) => {
    expect(measureModifier(measure)).toBe(modifier)
  })
})

describe('ingredientName', () => {
  it.each([
    // The measure holds the word that changes the ingredient (all real TheMealDB lines).
    ['2 tsp ground', 'Coriander', 'ground coriander'],
    ['2 tsp ground', 'Garlic', 'garlic powder'],
    ['Ground', 'Mustard', 'mustard powder'],
    ['Ground', 'Red Pepper', 'cayenne pepper'],
    ['1 red', 'Pepper', 'bell pepper'],
    ['1 Yolk', 'Egg', 'egg yolk'],
    // Descriptors and prep notes in the measure change nothing.
    ['1 small finely diced', 'Red Onions', 'red onion'],
    ['1 cut into 1/2-inch cubes', 'Squash', 'squash'],
    ['For frying', 'Vegetable Oil', 'vegetable oil'],
    ['Juice of 1', 'Lime', 'lime'],
    ['4 tsp ground', 'Cumin', 'cumin'],
    ['2 tsp', 'Coriander', 'coriander'],
    ['', 'Pepper', 'black pepper'],
  ])('%j + %j → %j', (measure, ingredient, name) => {
    expect(ingredientName(measure, ingredient)).toBe(name)
  })
})

describe('toLocalRecipe', () => {
  it('turns a meal into a valid local recipe, keeping the source text', () => {
    const { recipe, dropped, gaps, doubts } = seed('53027')
    expect(LocalRecipeSchema.parse(recipe)).toEqual(recipe)
    expect(recipe).toMatchObject({
      id: 'local:53027',
      mealDbId: '53027',
      title: 'Koshari',
      imageUrl: 'https://www.themealdb.com/images/media/meals/4er7mj1598733193.jpg',
      category: 'Vegetarian',
      cuisine: 'Egyptian',
      diets: ['vegetarian', 'vegan', 'dairy-free', 'pescatarian'],
      dietsEstimated: true,
      sourceUrl: 'https://www.themediterraneandish.com/egyptian-koshari-recipe/',
      attribution: ATTRIBUTION,
    })
    expect(recipe.ingredients.slice(0, 2)).toEqual([
      { raw: '1 1/2 cups Brown Lentils', name: 'brown lentil', amount: 1.5, unit: 'cup' },
      { raw: '1 1/2 cups Rice', name: 'rice', amount: 1.5, unit: 'cup' },
    ])
    expect(recipe.ingredients.find((line) => line.name === 'onion')).toEqual({
      raw: '1 large Onion',
      name: 'onion',
      amount: 1,
    })
    expect(recipe.instructions[0]).toMatch(/^Cook the lentils\. Bring lentils and 4 cups/)
    expect({ dropped, gaps, doubts }).toEqual({ dropped: [], gaps: [], doubts: [] })
  })

  it('reads ingredient-changing words from the measure', () => {
    const chili = seed('52784').recipe.ingredients
    expect(chili.find((line) => line.raw === '2 tsp ground Coriander')?.name).toBe(
      'ground coriander',
    )
    expect(chili.find((line) => line.raw === '4 tsp ground Cumin')?.name).toBe('cumin')
    const primavera = seed('52796').recipe.ingredients
    expect(primavera.find((line) => line.raw === '1 red Pepper')).toEqual({
      raw: '1 red Pepper',
      name: 'bell pepper',
      amount: 1,
    })
  })

  it('keeps every line, even repeated names, and states only what the measure says', () => {
    const lines = seed('53483').recipe.ingredients
    expect(lines).toHaveLength(18)
    expect(lines.filter((line) => line.name === 'red onion')).toHaveLength(2)
    expect(lines.find((line) => line.raw === 'For frying Vegetable Oil')).toEqual({
      raw: 'For frying Vegetable Oil',
      name: 'vegetable oil',
    })
  })

  it('splits messy instructions into clean steps', () => {
    // "step 1" headings (Acaraje), a one-paragraph method (Primavera), "1." numbering (Mandi).
    expect(seed('53483').recipe.instructions).toHaveLength(3)
    expect(seed('53483').recipe.instructions[0]).toMatch(/^Make the filling/)
    expect(seed('52796').recipe.instructions.length).toBeGreaterThanOrEqual(2)
    expect(seed('53359').recipe.instructions[0]).toBe(
      'Wash the beef and cut into large pieces. Season lightly with salt and turmeric.',
    )
  })

  it('trims titles and keeps their case as published', () => {
    expect(seed('52969').recipe.title).toBe('Chakchouka')
    expect(seed('53220').recipe.title).toBe('kabse')
  })

  it('keeps http and https sources and drops empty or invalid ones', () => {
    expect(seed('52784').recipe.sourceUrl).toMatch(/^http:\/\/www\.wholeheartedeats\.com\//)
    expect(seed('52796').recipe).not.toHaveProperty('sourceUrl')
    expect(seedEdited('53027', { strSource: 'see the blog' }).recipe).not.toHaveProperty(
      'sourceUrl',
    )
    expect(
      seedEdited('53027', { strSource: 'ftp://example.com/koshari' }).recipe,
    ).not.toHaveProperty('sourceUrl')
    expect(seedEdited('53027', { strSource: null }).recipe).not.toHaveProperty('sourceUrl')
  })

  it('labels the cuisine from the country, or from an override', () => {
    expect(seed('53359').recipe.cuisine).toBe('Indian')
    expect(seed('53251').recipe.cuisine).toBe('Vietnamese')
    const cuisineOverrides: CuisineOverrides = {
      '53359': { cuisine: 'Arabian', reason: 'Mandi is from the Arabian Peninsula.' },
      '53251': { cuisine: 'Turkish', reason: 'Lahmacun is Turkish.' },
    }
    expect(seed('53359', { cuisineOverrides }).recipe.cuisine).toBe('Arabian')
    expect(seed('53251', { cuisineOverrides }).recipe.cuisine).toBe('Turkish')
  })

  it('estimates diets from the lines, including staples', () => {
    expect(seed('53030').recipe.diets).toEqual(['vegetarian', 'pescatarian'])
    expect(seed('52819').recipe.diets).toEqual(['pescatarian'])
    expect(seed('52796').recipe.diets).toEqual([])
  })

  it('uses reviewed diets when there are some, in DIETS order', () => {
    const dietOverrides: DietOverrides = {
      '53027': { title: 'Koshari', diets: ['pescatarian', 'dairy-free', 'vegetarian'] },
    }
    const { recipe, doubts } = seed('53027', { dietOverrides })
    expect(recipe.diets).toEqual(['vegetarian', 'dairy-free', 'pescatarian'])
    expect(recipe.dietsEstimated).toBe(false)
    expect(doubts).toEqual([])
    expect(seed('53030', { dietOverrides }).recipe.dietsEstimated).toBe(true)
  })

  it('claims no meat-free diet when the category names meat the lines leave out', () => {
    // The pork belly itself is missing: TheMealDB lists only the marinade.
    const { recipe, gaps } = seed('53432')
    expect(recipe.diets).toEqual(['gluten-free', 'dairy-free'])
    expect(gaps).toEqual([
      'filed under Pork, but no ingredient line is pork',
      'the title names meat or fish, but no ingredient line does',
    ])
  })

  it('claims no vegetarian diet when the title names fish the lines leave out', () => {
    const { recipe, gaps } = seed('53430')
    expect(recipe.diets).toEqual(['gluten-free', 'pescatarian'])
    expect(gaps).toEqual(['the title names meat or fish, but no ingredient line does'])
  })

  it('reports seafood filed without seafood', () => {
    const { recipe, gaps } = seedEdited('52784', { strCategory: 'Seafood' })
    expect(recipe.diets).toEqual(['gluten-free', 'dairy-free', 'pescatarian'])
    expect(gaps).toEqual(['filed under Seafood, but no ingredient line is seafood'])
  })

  it('flags tags the title argues against for review, without changing them', () => {
    const { recipe, doubts, gaps } = seedEdited('52784', { strMeal: 'Smoky Lentil Cannelloni' })
    expect(recipe.diets).toContain('gluten-free')
    expect(doubts).toEqual(['gluten-free'])
    expect(gaps).toEqual([])
  })

  it('drops lines without a usable name, reports them, and still classifies their text', () => {
    const { recipe, dropped } = seedEdited('53027', {
      strIngredient9: '-',
      strMeasure9: '1 tbsp',
      strIngredient10: '',
      strMeasure10: '2 eggs',
    })
    expect(dropped).toEqual(['1 tbsp -', '2 eggs'])
    expect(recipe.ingredients).toHaveLength(8)
    // "2 eggs" has no ingredient name but still rules out vegan.
    expect(recipe.diets).toEqual(['vegetarian', 'dairy-free', 'pescatarian'])
  })

  it('spaces raw lines once', () => {
    const { recipe } = seedEdited('53027', {
      strMeasure1: ' 1 1/2   cups ',
      strIngredient1: ' Brown  Lentils ',
    })
    expect(recipe.ingredients[0]?.raw).toBe('1 1/2 cups Brown Lentils')
  })

  it.each([
    [{ strCountry: 'Atlantis' }, /no cuisine label for country "Atlantis"/],
    [{ strCountry: null }, /no cuisine label for country ""/],
    [{ strMealThumb: 'https://example.com/koshari.jpg' }, /imageUrl/],
    [{ strMealThumb: 'http://www.themealdb.com/images/media/meals/x.jpg' }, /imageUrl/],
    [{ strInstructions: ' ' }, /instructions/],
    [{ strInstructions: null }, /instructions/],
    [{ strCategory: null }, /category/],
    [{ strMeal: '  ' }, /title/],
  ])('throws, naming the meal, for %j', (edits, message) => {
    expect(() => seedEdited('53027', edits)).toThrow(/^Meal 53027 \(.*\): /)
    expect(() => seedEdited('53027', edits)).toThrow(message)
  })

  it('throws when no line has a usable name', () => {
    const empty: Partial<MealDbMeal> = {}
    for (let slot = 1; slot <= 20; slot++) empty[`strIngredient${slot}`] = null
    expect(() => seedEdited('53027', empty)).toThrow(/ingredients/)
  })
})
