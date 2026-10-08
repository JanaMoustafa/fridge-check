import { describe, expect, it } from 'vitest'
import { defaultMeal } from './default-meal'

describe('defaultMeal', () => {
  it.each([
    ['Breakfast', 'breakfast'],
    ['brunch', 'breakfast'],
    ['Dessert', 'snacks'],
    ['Side', 'snacks'],
    ['Starter', 'snacks'],
    ['fingerfood', 'snacks'],
    ['dinner', 'dinner'],
    ['main course', 'lunch'],
    ['Beef', 'lunch'],
    [undefined, 'lunch'],
  ])('%s → %s', (category, meal) => {
    expect(defaultMeal(category)).toBe(meal)
  })
})
