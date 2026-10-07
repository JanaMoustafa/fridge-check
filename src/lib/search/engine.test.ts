import { describe, expect, it } from 'vitest'
import arabicNames from '../../../data/i18n/ingredients.ar.json'
import { buildIngredientIndex, isKnownIngredient, resolveIngredient, suggest } from './engine'

describe('ingredient input engine', () => {
  const index = buildIngredientIndex(arabicNames)

  it('suggests from canonical names, synonyms and both Arabic tables', () => {
    expect(suggest(index, 'eggpl')[0]).toBe('eggplant')
    expect(suggest(index, 'aubergine')[0]).toBe('eggplant')
    expect(suggest(index, 'باذنج')[0]).toBe('eggplant')
    expect(suggest(index, 'استاكوزا')[0]).toBe('lobster')
  })

  it('resolves what the user picks or types to a canonical chip', () => {
    expect(resolveIngredient('2 large ripe tomatoes, diced')).toEqual({
      input: '2 large ripe tomatoes, diced',
      canonical: 'tomato',
      changed: true,
    })
  })

  it('knows real ingredients but not typos', () => {
    expect(isKnownIngredient('tomato')).toBe(true)
    expect(isKnownIngredient('tomat')).toBe(false)
  })

  it('builds an index without Arabic display names too', () => {
    expect(suggest(buildIngredientIndex(), 'tomat')[0]).toBe('tomato')
  })
})
