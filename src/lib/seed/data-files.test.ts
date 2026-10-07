import { describe, expect, it } from 'vitest'
import type { LocalRecipe } from '@/types/recipe'
import {
  CuisineOverridesSchema,
  DietOverrideSchema,
  DietOverridesSchema,
  SeedAllowlistSchema,
  sortDiets,
  toAllowlist,
} from './data-files'

function issues(result: { success: boolean; error?: { issues: Array<{ message: string }> } }) {
  return result.error?.issues.map((issue) => issue.message) ?? []
}

describe('SeedAllowlistSchema', () => {
  it('accepts TheMealDB ids with labels', () => {
    const allowlist = { version: 1, recipes: { '53027': 'Koshari (Egyptian)' } }
    expect(SeedAllowlistSchema.parse(allowlist)).toEqual(allowlist)
  })

  it.each([
    [{ version: 2, recipes: {} }],
    [{ version: 1, recipes: { 'local:53027': 'Koshari' } }],
    [{ version: 1, recipes: { '53027': '' } }],
  ])('rejects %j', (allowlist) => {
    expect(SeedAllowlistSchema.safeParse(allowlist).success).toBe(false)
  })
})

describe('CuisineOverridesSchema', () => {
  const valid = { cuisine: 'Arabian', reason: 'Mandi is from the Arabian Peninsula.' }

  it('accepts a known label with a reason', () => {
    expect(CuisineOverridesSchema.parse({ version: 1, recipes: { '53359': valid } })).toEqual({
      version: 1,
      recipes: { '53359': valid },
    })
  })

  it('rejects an unknown label, a missing reason and unknown fields', () => {
    const parse = (override: object) =>
      CuisineOverridesSchema.safeParse({ version: 1, recipes: { '53359': override } })
    expect(issues(parse({ ...valid, cuisine: 'Arabic' }))).toEqual([
      'unknown cuisine label (add it to src/lib/seed/cuisines.ts first)',
    ])
    expect(parse({ cuisine: 'Arabian', reason: ' ' }).success).toBe(false)
    expect(parse({ ...valid, country: 'Yemen' }).success).toBe(false)
  })
})

describe('DietOverrideSchema', () => {
  const koshari = {
    title: 'Koshari',
    diets: ['vegetarian', 'vegan', 'dairy-free', 'pescatarian'],
    note: 'Checked every line.',
  }

  it('accepts a consistent reviewed list, and an empty one', () => {
    expect(DietOverrideSchema.parse(koshari)).toEqual(koshari)
    expect(DietOverrideSchema.parse({ title: 'Beef Mandi', diets: [] })).toEqual({
      title: 'Beef Mandi',
      diets: [],
    })
  })

  it.each([
    [['vegan', 'vegetarian', 'pescatarian'], 'vegan implies dairy-free'],
    [['vegan', 'dairy-free', 'pescatarian'], 'vegan implies vegetarian'],
    [['vegetarian'], 'vegetarian implies pescatarian'],
    [['gluten-free', 'gluten-free'], 'diets are listed twice'],
  ])('rejects %j: %s', (diets, message) => {
    expect(issues(DietOverrideSchema.safeParse({ title: 'Koshari', diets }))).toEqual([message])
  })

  it('needs the title and allows nothing else', () => {
    expect(DietOverrideSchema.safeParse({ diets: [] }).success).toBe(false)
    expect(DietOverrideSchema.safeParse({ ...koshari, dietsEstimated: false }).success).toBe(false)
    expect(DietOverrideSchema.safeParse({ ...koshari, diets: ['keto'] }).success).toBe(false)
  })

  it('is keyed by TheMealDB id in the file', () => {
    expect(DietOverridesSchema.parse({ version: 1, recipes: {} })).toEqual({
      version: 1,
      recipes: {},
    })
    const keyed = { version: 1, recipes: { 'local:53027': koshari } }
    expect(DietOverridesSchema.safeParse(keyed).success).toBe(false)
  })
})

describe('sortDiets', () => {
  it('puts diets in DIETS order', () => {
    expect(sortDiets(['pescatarian', 'gluten-free', 'vegetarian'])).toEqual([
      'vegetarian',
      'gluten-free',
      'pescatarian',
    ])
  })
})

describe('toAllowlist', () => {
  it('labels each id with its title and cuisine, ids ascending', () => {
    const recipes = [
      { mealDbId: '53359', title: 'Beef Mandi', cuisine: 'Arabian' },
      { mealDbId: '53027', title: 'Koshari', cuisine: 'Egyptian' },
    ] as LocalRecipe[]
    const allowlist = toAllowlist(recipes)
    expect(allowlist).toEqual({
      version: 1,
      recipes: { '53027': 'Koshari (Egyptian)', '53359': 'Beef Mandi (Arabian)' },
    })
    expect(Object.keys(allowlist.recipes)).toEqual(['53027', '53359'])
    expect(SeedAllowlistSchema.parse(allowlist)).toEqual(allowlist)
  })
})
