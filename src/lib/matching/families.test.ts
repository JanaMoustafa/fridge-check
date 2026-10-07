import { describe, expect, it } from 'vitest'
import { CanonicalNameSchema } from '@/types/recipe'
import { normalizeEnglishIngredient } from './english'
import { FAMILIES, type FamilyTable, ancestorsOf, isFamilyMatch, parentOf } from './families'

const pairs = Object.entries(FAMILIES)
const names = [...new Set(pairs.flat())]

describe('FAMILIES', () => {
  it('has at least 40 child → parent pairs', () => {
    expect(pairs.length).toBeGreaterThanOrEqual(40)
  })

  it.each(names)('%s is a canonical name and a normalizer fixed point', (name) => {
    expect(CanonicalNameSchema.safeParse(name).success).toBe(true)
    expect(normalizeEnglishIngredient(name)).toBe(name)
  })

  it('has no cycles and no self-parents', () => {
    for (const [child, parent] of pairs) {
      expect(parent).not.toBe(child)
      expect(ancestorsOf(child)).not.toContain(child)
      expect(ancestorsOf(child).length).toBeLessThan(pairs.length)
    }
  })
})

describe('parentOf', () => {
  it.each([
    ['chicken breast', 'chicken'],
    ['cheddar', 'cheese'],
    ['basmati rice', 'rice'],
    ['red onion', 'onion'],
    ['cherry tomato', 'tomato'],
    ['smoked paprika', 'paprika'],
    ['greek yogurt', 'yogurt'],
    ['spaghetti', 'pasta'],
    ['red lentil', 'lentil'],
    ['ground beef', 'beef'],
    ['steak', 'beef'],
    ['jalapeno', 'chili'],
    ['brown sugar', 'sugar'],
    ['heavy cream', 'cream'],
    ['self-raising flour', 'flour'],
    ['chicken stock', 'stock'],
    // Egg pasta keeps its own name so the diet classifier can see the egg.
    ['fresh pasta', 'pasta'],
    ['egg pasta', 'pasta'],
    ['egg noodle', 'noodle'],
    ['ground veal', 'veal'],
  ])('%s → %s', (child, parent) => expect(parentOf(child)).toBe(parent))

  it.each(['chicken', 'tomato paste', 'unknown thing', 'constructor', 'toString', ''])(
    '%s has no parent',
    (name) => expect(parentOf(name)).toBeUndefined(),
  )
})

describe('ancestorsOf', () => {
  it('lists every ancestor, nearest first', () => {
    expect(ancestorsOf('sirloin steak')).toEqual(['steak', 'beef'])
    expect(ancestorsOf('cod')).toEqual(['white fish', 'fish'])
    expect(ancestorsOf('muscovado sugar')).toEqual(['brown sugar', 'sugar'])
    expect(ancestorsOf('sunflower oil')).toEqual(['vegetable oil', 'oil'])
  })

  it('is empty for roots and unknown names', () => {
    expect(ancestorsOf('chicken')).toEqual([])
    expect(ancestorsOf('dragon fruit')).toEqual([])
  })

  it('stops on a cycle instead of looping forever', () => {
    const broken: FamilyTable = { a: 'b', b: 'c', c: 'a' }
    expect(ancestorsOf('a', broken)).toEqual(['b', 'c'])
    expect(ancestorsOf('x', { x: 'x' })).toEqual([])
    expect(isFamilyMatch('a', 'c', broken)).toBe(true)
  })
})

describe('isFamilyMatch', () => {
  it.each([
    ['chicken breast', 'chicken'],
    ['chicken', 'chicken breast'],
    ['cheddar', 'cheese'],
    ['sirloin steak', 'beef'],
    ['cod', 'fish'],
    ['basmati rice', 'rice'],
    ['olive oil', 'oil'],
    ['ghee', 'butter'],
  ])('%s ~ %s', (a, b) => expect(isFamilyMatch(a, b)).toBe(true))

  it.each([
    ['chicken', 'chicken'],
    ['cheddar', 'mozzarella'],
    ['olive oil', 'sunflower oil'],
    ['ground beef', 'steak'],
    ['red lentil', 'brown lentil'],
    ['tomato paste', 'tomato'],
    ['ground ginger', 'ginger'],
    ['ground coriander', 'coriander'],
    ['sweet potato', 'potato'],
    ['smoked salmon', 'salmon'],
    ['cream cheese', 'cheese'],
    ['chicken', 'beef'],
    ['banana', 'unknown'],
  ])('%s ≁ %s', (a, b) => expect(isFamilyMatch(a, b)).toBe(false))
})
