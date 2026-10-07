import { describe, expect, it } from 'vitest'
import { SORT_KEYS, type SortKey } from '@/types/recipe'
import { type RankedRecipe, compareResults } from './sort'

interface Shape {
  title?: string
  missing?: number
  score?: number
  matched?: number
  minutes?: number
}

/** A scored recipe with the given number of missing and matched items. */
function entry({ title = 'Dish', missing = 1, score = 0.5, matched = 1, minutes }: Shape) {
  const result: RankedRecipe = {
    title,
    ingredients: [],
    usedIngredients: [],
    missingIngredients: Array.from({ length: missing }, (_, i) => `missing ${i}`),
    matchedUserIngredients: Array.from({ length: matched }, (_, i) => `user ${i}`),
    matchScore: score,
  }
  return minutes === undefined ? result : { ...result, readyInMinutes: minutes }
}

function sign(value: number) {
  return Math.sign(value)
}

type Case = [level: string, first: Shape, second: Shape]

// Each row differs at one level and loses at every later level, so only that level can decide.
const CASES: Record<SortKey, Case[]> = {
  'fewest-missing': [
    [
      'missing count',
      { missing: 1, score: 0.2, matched: 1, minutes: 90, title: 'Z' },
      { missing: 2, score: 0.9, matched: 5, minutes: 5, title: 'A' },
    ],
    [
      'match score',
      { missing: 1, score: 0.9, matched: 1, minutes: 90, title: 'Z' },
      { missing: 1, score: 0.8, matched: 5, minutes: 5, title: 'A' },
    ],
    [
      'matched user items',
      { missing: 1, score: 0.5, matched: 3, minutes: 90, title: 'Z' },
      { missing: 1, score: 0.5, matched: 2, minutes: 5, title: 'A' },
    ],
    [
      'cook time',
      { missing: 1, score: 0.5, matched: 2, minutes: 20, title: 'Z' },
      { missing: 1, score: 0.5, matched: 2, minutes: 40, title: 'A' },
    ],
    [
      'known time before unknown',
      { missing: 1, score: 0.5, matched: 2, minutes: 600, title: 'Z' },
      { missing: 1, score: 0.5, matched: 2, title: 'A' },
    ],
    ['title', { title: 'Apple', minutes: 30 }, { title: 'Banana', minutes: 30 }],
    ['title with both times unknown', { title: 'Apple' }, { title: 'Banana' }],
  ],
  best: [
    [
      'match score',
      { score: 0.9, missing: 3, matched: 1, minutes: 90, title: 'Z' },
      { score: 0.8, missing: 0, matched: 5, minutes: 5, title: 'A' },
    ],
    [
      'missing count',
      { score: 0.5, missing: 1, matched: 1, minutes: 90, title: 'Z' },
      { score: 0.5, missing: 2, matched: 5, minutes: 5, title: 'A' },
    ],
    [
      'matched user items',
      { score: 0.5, missing: 1, matched: 3, minutes: 90, title: 'Z' },
      { score: 0.5, missing: 1, matched: 2, minutes: 5, title: 'A' },
    ],
    [
      'cook time',
      { score: 0.5, missing: 1, matched: 2, minutes: 20, title: 'Z' },
      { score: 0.5, missing: 1, matched: 2, minutes: 40, title: 'A' },
    ],
    [
      'known time before unknown',
      { score: 0.5, missing: 1, matched: 2, minutes: 600, title: 'Z' },
      { score: 0.5, missing: 1, matched: 2, title: 'A' },
    ],
    ['title', { title: 'Apple' }, { title: 'Banana' }],
  ],
  quickest: [
    [
      'cook time',
      { minutes: 20, missing: 3, score: 0.2, matched: 1, title: 'Z' },
      { minutes: 40, missing: 0, score: 0.9, matched: 5, title: 'A' },
    ],
    [
      'known time before unknown',
      { minutes: 600, missing: 3, score: 0.2, matched: 1, title: 'Z' },
      { missing: 0, score: 0.9, matched: 5, title: 'A' },
    ],
    [
      'missing count',
      { minutes: 30, missing: 1, score: 0.2, matched: 1, title: 'Z' },
      { minutes: 30, missing: 2, score: 0.9, matched: 5, title: 'A' },
    ],
    [
      'missing count with both times unknown',
      { missing: 1, score: 0.2, matched: 1, title: 'Z' },
      { missing: 2, score: 0.9, matched: 5, title: 'A' },
    ],
    [
      'match score',
      { minutes: 30, missing: 1, score: 0.9, matched: 1, title: 'Z' },
      { minutes: 30, missing: 1, score: 0.8, matched: 5, title: 'A' },
    ],
    [
      'matched user items',
      { minutes: 30, missing: 1, score: 0.5, matched: 3, title: 'Z' },
      { minutes: 30, missing: 1, score: 0.5, matched: 2, title: 'A' },
    ],
    ['title', { title: 'Apple', minutes: 30 }, { title: 'Banana', minutes: 30 }],
  ],
}

describe('compareResults', () => {
  it('covers every sort key', () => {
    expect(Object.keys(CASES).sort()).toEqual([...SORT_KEYS].sort())
  })

  describe.each(SORT_KEYS)('%s', (sort) => {
    const compare = compareResults(sort)

    it.each(CASES[sort])('decides on %s', (_, first, second) => {
      const a = entry(first)
      const b = entry(second)
      expect(compare(a, b)).toBeLessThan(0)
      expect(compare(b, a)).toBeGreaterThan(0)
      expect([b, a].sort(compare)).toEqual([a, b])
    })

    it('returns 0 for equal entries and keeps their input order', () => {
      const a = entry({ title: 'Same', minutes: 10 })
      const b = entry({ title: 'Same', minutes: 10 })
      expect(compare(a, b)).toBe(0)
      expect([a, b].sort(compare)[0]).toBe(a)
      expect([b, a].sort(compare)[0]).toBe(b)
    })
  })

  it('sorts titles by English collation, not code units', () => {
    const compare = compareResults('best')
    const titles = ['banana bread', 'Apple pie', 'apple crumble', 'Éclair', 'Zucchini fritters']
    const sorted = titles.map((title) => entry({ title })).sort(compare)
    expect(sorted.map((r) => r.title)).toEqual([
      'apple crumble',
      'Apple pie',
      'banana bread',
      'Éclair',
      'Zucchini fritters',
    ])
  })

  it('separates titles that collate equal but differ in code units', () => {
    const compare = compareResults('fewest-missing')
    const composed = entry({ title: 'Café salad' })
    const decomposed = entry({ title: 'Café salad' })
    expect(compare(composed, decomposed)).toBeGreaterThan(0)
    expect(compare(decomposed, composed)).toBeLessThan(0)
  })

  // A pool with ties at every level: the comparator must be a consistent total order, so the
  // sorted result cannot depend on the order a provider happened to return.
  const pool = [
    entry({ title: 'Koshari', missing: 0, score: 0.8, matched: 3, minutes: 60 }),
    entry({ title: 'Ful medames', missing: 0, score: 0.8, matched: 3 }),
    entry({ title: 'Shakshuka', missing: 0, score: 1, matched: 4, minutes: 25 }),
    entry({ title: 'Fattoush', missing: 2, score: 0.8, matched: 3, minutes: 15 }),
    entry({ title: 'Mandi', missing: 2, score: 0.6, matched: 2, minutes: 120 }),
    entry({ title: 'Kabsa', missing: 1, score: 0.9, matched: 2, minutes: 90 }),
    entry({ title: 'Molokhia', missing: 1, score: 0.9, matched: 2, minutes: 90 }),
    entry({ title: 'Hummus', missing: 1, score: 0.9, matched: 3 }),
    entry({ title: 'Falafel', missing: 1, score: 0.75, matched: 4, minutes: 45 }),
    entry({ title: 'Baba ganoush', missing: 3, score: 0.4, matched: 1, minutes: 15 }),
  ]

  function permutations(items: readonly RankedRecipe[]) {
    const reversed = [...items].reverse()
    const rotated = items.map((_, i) => [...items.slice(i), ...items.slice(0, i)])
    const interleaved = [...items.filter((_, i) => i % 2), ...items.filter((_, i) => !(i % 2))]
    return [reversed, interleaved, ...rotated]
  }

  it.each([
    [
      'fewest-missing',
      [
        'Shakshuka',
        'Koshari',
        'Ful medames',
        'Hummus',
        'Kabsa',
        'Molokhia',
        'Falafel',
        'Fattoush',
        'Mandi',
        'Baba ganoush',
      ],
    ],
    [
      'best',
      [
        'Shakshuka',
        'Hummus',
        'Kabsa',
        'Molokhia',
        'Koshari',
        'Ful medames',
        'Fattoush',
        'Falafel',
        'Mandi',
        'Baba ganoush',
      ],
    ],
    [
      'quickest',
      [
        'Fattoush',
        'Baba ganoush',
        'Shakshuka',
        'Falafel',
        'Koshari',
        'Kabsa',
        'Molokhia',
        'Mandi',
        'Ful medames',
        'Hummus',
      ],
    ],
  ] as const)('sorts a tied pool by %s the same way from any input order', (sort, titles) => {
    const compare = compareResults(sort)
    for (const input of permutations(pool)) {
      expect(input.sort(compare).map((r) => r.title)).toEqual(titles)
    }
  })

  it.each(SORT_KEYS)('%s is antisymmetric and transitive over the pool', (sort) => {
    const compare = compareResults(sort)
    for (const a of pool) {
      expect(compare(a, a)).toBe(0)
      for (const b of pool) {
        expect(sign(compare(a, b)) + sign(compare(b, a))).toBe(0)
        for (const c of pool) {
          if (compare(a, b) < 0 && compare(b, c) < 0) expect(compare(a, c)).toBeLessThan(0)
        }
      }
    }
  })
})
