import { describe, expect, it } from 'vitest'
import { recipeHref, recipeViewName, splitRecipeId } from './links'

describe('splitRecipeId', () => {
  it('splits namespaced ids', () => {
    expect(splitRecipeId('local:52772')).toEqual({ source: 'local', key: '52772' })
    expect(splitRecipeId('spoonacular:715538')).toEqual({ source: 'spoonacular', key: '715538' })
  })
  it.each(['52772', 'other:1', 'local:', 'local:a/b'])('rejects %s', (id) => {
    expect(splitRecipeId(id)).toBeNull()
  })
})

describe('recipeHref', () => {
  it('links to the detail route with the pantry', () => {
    expect(recipeHref('local:53027', ['rice', 'chicken breast', "za'atar"])).toBe(
      "/recipe/local/53027?i=rice,chicken%20breast,za'atar",
    )
  })
  it('omits an empty pantry', () => {
    expect(recipeHref('mealdb:52772')).toBe('/recipe/mealdb/52772')
  })
  it('throws on an invalid id', () => {
    expect(() => recipeHref('nope')).toThrow('Invalid recipe id')
  })
})

describe('recipeViewName', () => {
  it('produces a CSS identifier', () => {
    expect(recipeViewName('local:53027')).toBe('recipe-local-53027')
  })
})
