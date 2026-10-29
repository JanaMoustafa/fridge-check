import { describe, expect, it } from 'vitest'
import { isPlanFriendly } from './plan-filters'

describe('isPlanFriendly', () => {
  const dish = (category: string, ...names: string[]) => ({
    category,
    ingredients: names.map((name) => ({ name })),
  })

  it('keeps main dishes without pork or alcohol', () => {
    expect(isPlanFriendly(dish('Chicken', 'chicken', 'onion'))).toBe(true)
    expect(isPlanFriendly(dish('Vegetarian', 'lentil', 'rice'))).toBe(true)
  })

  it('leaves out desserts, sides, pork and anything cooked with alcohol', () => {
    expect(isPlanFriendly(dish('Dessert', 'sugar'))).toBe(false)
    expect(isPlanFriendly(dish('Pork', 'pork'))).toBe(false)
    expect(isPlanFriendly(dish('Chicken', 'chicken', 'bacon'))).toBe(false)
    expect(isPlanFriendly(dish('Seafood', 'prawn', 'white wine'))).toBe(false)
  })
})
