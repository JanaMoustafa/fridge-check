import { describe, expect, it } from 'vitest'
import { buildSuggestionIndex, foldForSearch, scoreTerm, suggest, withinOneEdit } from './suggest'

const index = buildSuggestionIndex([
  { canonical: 'tomato', phrases: ['tomato', 'tomatoes', 'طماطم', 'بندورة'] },
  { canonical: 'cherry tomato', phrases: ['cherry tomato', 'طماطم شيري'] },
  { canonical: 'tomato paste', phrases: ['tomato paste', 'tomato puree', 'صلصة'] },
  { canonical: 'eggplant', phrases: ['eggplant', 'aubergine', 'باذنجان'] },
  { canonical: 'egg', phrases: ['egg', 'eggs', 'بيض'] },
  { canonical: 'green onion', phrases: ['green onion', 'spring onion', 'scallion', 'بصل أخضر'] },
  { canonical: 'onion', phrases: ['onion', 'بصل'] },
  { canonical: 'garlic', phrases: ['garlic', 'ثوم', 'توم'] },
])

describe('foldForSearch', () => {
  it.each([
    ['  Crème  Fraîche ', 'creme fraiche'],
    ['Tomato-Paste!', 'tomato paste'],
    ['الطَّمَاطِم', 'الطماطم'],
    ['أرز', 'ارز'],
    ["Za'atar", "za'atar"],
  ])('%s → %s', (input, expected) => expect(foldForSearch(input)).toBe(expected))
})

describe('withinOneEdit', () => {
  it.each([
    ['garlic', 'garlic', true],
    ['garlc', 'garlic', true],
    ['gralic', 'garlic', true],
    ['garlix', 'garlic', true],
    ['garlicc', 'garlic', true],
    ['grlc', 'garlic', false],
    ['onion', 'union', true],
    ['abc', 'xyz', false],
  ])('%s ~ %s → %s', (a, b, expected) => expect(withinOneEdit(a, b)).toBe(expected))
})

describe('scoreTerm', () => {
  it('ranks exact > prefix > word prefix > substring > typo > subsequence', () => {
    const scores = [
      scoreTerm('onion', 'onion'),
      scoreTerm('oni', 'onion'),
      scoreTerm('oni', 'green onion'),
      scoreTerm('nio', 'onion'),
      scoreTerm('gralic', 'garlic'),
      scoreTerm('tmt', 'tomato'),
    ]
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    expect(scores.every((score) => score > 0)).toBe(true)
  })

  it('returns 0 for unrelated terms', () => {
    expect(scoreTerm('xyz', 'tomato')).toBe(0)
  })
})

describe('suggest', () => {
  it('suggests by prefix, best match first', () => {
    expect(suggest(index, 'tom')).toEqual(['tomato', 'tomato paste', 'cherry tomato'])
  })

  it('finds synonyms and UK names', () => {
    expect(suggest(index, 'aubergine')).toEqual(['eggplant'])
    expect(suggest(index, 'scall')).toEqual(['green onion'])
  })

  it('tolerates a typo', () => {
    expect(suggest(index, 'garlc')).toEqual(['garlic'])
  })

  it('works in Arabic, including Egyptian spellings and hamza/article variants', () => {
    expect(suggest(index, 'طماط')).toEqual(['tomato', 'cherry tomato'])
    expect(suggest(index, 'توم')).toEqual(['garlic'])
    expect(suggest(index, 'بصل')[0]).toBe('onion')
  })

  it('excludes ingredients already chosen and respects the limit', () => {
    expect(suggest(index, 'tom', { exclude: new Set(['tomato']) })).toEqual([
      'tomato paste',
      'cherry tomato',
    ])
    expect(suggest(index, 'e', { limit: 1 })).toHaveLength(1)
  })

  it('returns nothing for empty input', () => {
    expect(suggest(index, '   ')).toEqual([])
  })

  it('dedupes repeated phrases when building the index', () => {
    const small = buildSuggestionIndex([{ canonical: 'egg', phrases: ['Egg', 'egg', ' '] }])
    expect(small.terms).toEqual([{ canonical: 'egg', term: 'egg' }])
  })
})
