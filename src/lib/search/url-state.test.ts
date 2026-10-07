import { describe, expect, it } from 'vitest'
import { parseSearchUrl, toSearchUrl } from './url-state'

const parse = (query: string) => parseSearchUrl(new URLSearchParams(query))

describe('parseSearchUrl', () => {
  it('reads ingredients, diets and sort', () => {
    expect(parse('i=chicken,garlic&diet=vegetarian&sort=best')).toEqual({
      ingredients: ['chicken', 'garlic'],
      diets: ['vegetarian'],
      sort: 'best',
    })
  })

  it('defaults to an empty search sorted by fewest missing', () => {
    expect(parse('')).toEqual({ ingredients: [], diets: [], sort: 'fewest-missing' })
  })

  it('keeps what is valid in a hand-edited link', () => {
    expect(
      parse('i=Tomato, egg,,<b>,egg,' + 'x'.repeat(41) + '&diet=vegan,keto&sort=nope'),
    ).toEqual({ ingredients: ['tomato', 'egg'], diets: ['vegan'], sort: 'fewest-missing' })
  })

  it('keeps diets in their canonical order', () => {
    expect(parse('diet=pescatarian,vegan').diets).toEqual(['vegan', 'pescatarian'])
  })

  it('caps the list at 20 ingredients', () => {
    const many = Array.from({ length: 25 }, (_, i) => `item${i}`).join(',')
    expect(parse(`i=${many}`).ingredients).toHaveLength(20)
  })
})

describe('toSearchUrl', () => {
  it('omits defaults and keeps commas readable', () => {
    expect(
      toSearchUrl({ ingredients: ['chicken', 'garlic'], diets: [], sort: 'fewest-missing' }),
    ).toBe('?i=chicken,garlic')
    expect(toSearchUrl({ ingredients: [], diets: [], sort: 'fewest-missing' })).toBe('')
  })

  it('round-trips, keeping chip order', () => {
    const state = {
      ingredients: ['tomato', 'chicken breast', "za'atar"],
      diets: ['vegan' as const],
      sort: 'best' as const,
    }
    expect(parse(toSearchUrl(state).slice(1))).toEqual(state)
  })
})
