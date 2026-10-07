import { describe, expect, it } from 'vitest'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'
import recipesFile from '../../../data/recipes.json'
import { CUISINE_LABELS } from '@/lib/seed/cuisines'
import { labelSlug } from './cuisines'

describe('labelSlug', () => {
  it.each([
    ['Egyptian', 'egyptian'],
    ['Saudi Arabian', 'saudi-arabian'],
    ['Costa Rican', 'costa-rican'],
    ['  Miscellaneous ', 'miscellaneous'],
  ])('%s → %s', (label, slug) => expect(labelSlug(label)).toBe(slug))
})

describe('cuisine and category labels', () => {
  const categories = new Set(recipesFile.recipes.map((recipe) => recipe.category))

  it.each([...CUISINE_LABELS])('cuisine "%s" has an English and an Arabic label', (label) => {
    const key = labelSlug(label) as keyof typeof en.cuisine
    expect(en.cuisine[key]).toBe(label)
    expect(ar.cuisine[key]).toMatch(/[؀-ۿ]/)
  })

  it.each([...categories])('category "%s" has an English and an Arabic label', (label) => {
    const key = labelSlug(label) as keyof typeof en.category
    expect(en.category[key]).toBe(label)
    expect(ar.category[key]).toMatch(/[؀-ۿ]/)
  })
})
