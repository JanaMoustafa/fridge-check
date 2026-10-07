import { describe, expect, it } from 'vitest'
import arabicNames from '../../../data/i18n/ingredients.ar.json'
import recipesFile from '../../../data/recipes.json'
import { arabicAliasEntries } from '@/lib/matching/arabic'
import { FAMILIES } from '@/lib/matching/families'
import { normalizeIngredient } from '@/lib/matching/normalize'
import { STAPLES } from '@/lib/matching/staples'
import { CORE_CANONICALS } from '@/lib/matching/synonyms'
import { ingredientLabel, loadArabicIngredientNames } from './ingredient-names'

const table: Readonly<Record<string, string>> = arabicNames

describe('ingredientLabel', () => {
  it('uses sentence case in English', () => {
    expect(ingredientLabel('chicken breast', 'en', table)).toBe('Chicken breast')
    expect(ingredientLabel("za'atar", 'en')).toBe("Za'atar")
  })

  it('uses the Arabic table, falling back to English', () => {
    expect(ingredientLabel('tomato', 'ar', table)).toBe('طماطم')
    expect(ingredientLabel('not-in-table', 'ar', table)).toBe('Not-in-table')
    expect(ingredientLabel('tomato', 'ar')).toBe('Tomato')
  })

  it('loads the Arabic table on demand', async () => {
    expect(await loadArabicIngredientNames()).toEqual(table)
  })
})

describe('data/i18n/ingredients.ar.json', () => {
  const shown = new Set<string>([
    ...recipesFile.recipes.flatMap((recipe) => recipe.ingredients.map(({ name }) => name)),
    ...CORE_CANONICALS,
    ...Object.keys(FAMILIES),
    ...Object.values(FAMILIES),
    ...STAPLES,
    ...arabicAliasEntries().map(([, canonical]) => canonical),
  ])

  it('names every ingredient the app can show', () => {
    expect([...shown].filter((name) => !table[name])).toEqual([])
  })

  it('writes every name in Arabic script, without two ingredients sharing one', () => {
    const seen = new Map<string, string>()
    for (const [canonical, arabic] of Object.entries(table)) {
      expect(arabic, canonical).toMatch(/^[؀-ۿ\s'-]+$/)
      expect(seen.get(arabic), `${canonical} and ${seen.get(arabic)} share "${arabic}"`).toBe(
        undefined,
      )
      seen.set(arabic, canonical)
    }
  })

  it('round-trips: typing a displayed name finds that ingredient', () => {
    const misses = Object.entries(table).filter(
      ([canonical, arabic]) => normalizeIngredient(arabic) !== canonical,
    )
    expect(misses).toEqual([])
  })
})
