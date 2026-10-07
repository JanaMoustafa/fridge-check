import { describe, expect, it } from 'vitest'
import { loadRecipePage } from './recipe'

describe('loadRecipePage', () => {
  it('scores the recipe for the pantry with and without staples', async () => {
    // Koshari: brown lentil, rice, coriander, macaroni, chickpea, onion, salt, vegetable oil.
    const data = await loadRecipePage('local', '53027', 'rice,onion,salt')
    expect(data?.recipe.title).toBe('Koshari')
    expect(data?.withStaples.usedIngredients).toEqual(['rice', 'onion'])
    expect(data?.withStaples.missingIngredients).not.toContain('salt')
    expect(data?.withoutStaples.usedIngredients).toEqual(
      expect.arrayContaining(['rice', 'onion', 'salt']),
    )
    expect(data?.withoutStaples.missingIngredients).toContain('vegetable oil')
  })

  it('treats an empty pantry as having nothing', async () => {
    const data = await loadRecipePage('local', '53027', '')
    expect(data?.withStaples.usedIngredients).toEqual([])
  })

  it.each([
    ['an unknown id', 'local', '99999999'],
    ['a malformed id', 'local', 'a/b'],
    ['an unknown source', 'pantry', '53027'],
  ])('returns null for %s', async (_label, source, key) => {
    expect(await loadRecipePage(source, key, '')).toBeNull()
  })
})
