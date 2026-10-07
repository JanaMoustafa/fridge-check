import { describe, expect, it } from 'vitest'
import { CanonicalNameSchema } from '@/types/recipe'
import { normalizeEnglishIngredient } from './english'
import { STAPLES, isStaple } from './staples'

describe('STAPLES', () => {
  it('contains the spec list', () => {
    for (const name of [
      'salt',
      'black pepper',
      'water',
      'oil',
      'olive oil',
      'vegetable oil',
      'sugar',
      'flour',
      'butter',
    ]) {
      expect(STAPLES.has(name)).toBe(true)
    }
  })

  it.each([...STAPLES])('%s is a canonical name and a normalizer fixed point', (name) => {
    expect(CanonicalNameSchema.safeParse(name).success).toBe(true)
    expect(normalizeEnglishIngredient(name)).toBe(name)
  })
})

describe('isStaple', () => {
  it.each(['salt', 'black pepper', 'water', 'olive oil', 'sunflower oil', 'flour', 'butter'])(
    '%s is a staple',
    (name) => expect(isStaple(name)).toBe(true),
  )

  // No ancestor inference: a specific sugar or flour is something you might not have.
  it.each([
    'brown sugar',
    'powdered sugar',
    'self-raising flour',
    'bread flour',
    'sesame oil',
    'ghee',
    'egg',
    'garlic',
    'pepper',
    'sea salt',
    '',
  ])('%s is not a staple', (name) => expect(isStaple(name)).toBe(false))

  it('recognises staples reached through normalization', () => {
    for (const raw of ['Sea Salt', 'Plain Flour', 'Caster Sugar', 'Unsalted Butter', 'Pepper']) {
      expect(isStaple(normalizeEnglishIngredient(raw))).toBe(true)
    }
  })

  it.each([
    'salt and black pepper',
    'salt and freshly ground black pepper',
    'kosher salt and freshly ground pepper',
    'freshly ground sea salt',
  ])('recognises the staple line %j', (raw) =>
    expect(isStaple(normalizeEnglishIngredient(raw))).toBe(true),
  )

  // Plural "peppers" and pepper portions are bell peppers, which are never assumed on hand.
  it.each(['peppers', '2 peppers, sliced', 'large peppers', 'pepper strips'])(
    '%j is not a staple',
    (raw) => expect(isStaple(normalizeEnglishIngredient(raw))).toBe(false),
  )
})
