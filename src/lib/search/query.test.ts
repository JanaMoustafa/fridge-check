import { describe, expect, it } from 'vitest'
import { parseSearchQuery, toSearchQueryString } from './query'

const parse = (query: string) => parseSearchQuery(new URLSearchParams(query))

describe('parseSearchQuery', () => {
  it('parses a full query', () => {
    expect(
      parse('ingredients=tomato,chicken breast&diets=vegan,gluten-free&sort=best&staples=0&page=2'),
    ).toEqual({
      success: true,
      data: {
        ingredients: ['tomato', 'chicken breast'],
        diets: ['vegan', 'gluten-free'],
        sort: 'best',
        assumeStaples: false,
        page: 2,
      },
    })
  })

  it('applies defaults', () => {
    expect(parse('ingredients=egg').data).toEqual({
      ingredients: ['egg'],
      diets: [],
      sort: 'fewest-missing',
      assumeStaples: true,
      page: 1,
    })
  })

  it.each([
    ['no ingredients', ''],
    [
      'too many ingredients',
      `ingredients=${Array.from({ length: 21 }, (_, i) => `item${i}`).join(',')}`,
    ],
    ['an ingredient over 40 characters', `ingredients=${'a'.repeat(41)}`],
    ['disallowed characters', 'ingredients=<script>'],
    ['upper case (not canonical)', 'ingredients=Tomato'],
    ['Arabic text (not canonical)', 'ingredients=طماطم'],
    ['duplicates', 'ingredients=egg,egg'],
    ['an unknown diet', 'ingredients=egg&diets=keto'],
    ['an unknown sort', 'ingredients=egg&sort=random'],
    ['a bad staples flag', 'ingredients=egg&staples=yes'],
    ['a non-numeric page', 'ingredients=egg&page=two'],
    ['a page beyond the cap', 'ingredients=egg&page=51'],
  ])('rejects %s', (_label, query) => {
    expect(parse(query).success).toBe(false)
  })
})

describe('toSearchQueryString', () => {
  it('is canonical: sorted lists, defaults omitted', () => {
    const a = toSearchQueryString({
      ingredients: ['tomato', 'egg'],
      diets: ['vegan', 'dairy-free'],
      sort: 'fewest-missing',
      assumeStaples: true,
    })
    const b = toSearchQueryString({
      ingredients: ['egg', 'tomato'],
      diets: ['dairy-free', 'vegan'],
      sort: 'fewest-missing',
      assumeStaples: true,
    })
    expect(a).toBe(b)
    expect(a).toBe('ingredients=egg%2Ctomato&diets=dairy-free%2Cvegan')
  })

  it('includes non-default options and the page', () => {
    expect(
      toSearchQueryString(
        { ingredients: ['egg'], diets: [], sort: 'best', assumeStaples: false },
        3,
      ),
    ).toBe('ingredients=egg&sort=best&staples=0&page=3')
  })

  it('round-trips through the parser', () => {
    const params = {
      ingredients: ['rice', 'lentil'],
      diets: ['vegan' as const],
      sort: 'best' as const,
      assumeStaples: false,
    }
    const parsed = parse(toSearchQueryString(params, 2))
    expect(parsed.data).toEqual({ ...params, ingredients: ['lentil', 'rice'], page: 2 })
  })
})
