import { describe, expect, it } from 'vitest'
import { CanonicalNameSchema } from '@/types/recipe'
import { normalizeEnglishIngredient } from './english'
import { FAMILIES } from './families'
import { STAPLES } from './staples'
import { CANONICAL_NAMES, CORE_CANONICALS, SPELLINGS, SYNONYMS, lookupSynonym } from './synonyms'

const entries = Object.entries(SYNONYMS)

describe('SYNONYMS', () => {
  it('has at least 80 entries', () => {
    expect(entries.length).toBeGreaterThanOrEqual(80)
  })

  it('maps every value to a canonical name that is a normalizer fixed point', () => {
    const broken = [...new Set(Object.values(SYNONYMS))].filter(
      (value) =>
        !CanonicalNameSchema.safeParse(value).success ||
        normalizeEnglishIngredient(value) !== value,
    )
    expect(broken).toEqual([])
  })

  it('normalizes every key to its own value (every alias is reachable)', () => {
    const unreachable = entries
      .filter(([alias, canonical]) => normalizeEnglishIngredient(alias) !== canonical)
      .map(([alias, canonical]) => `${alias} → ${normalizeEnglishIngredient(alias)} ≠ ${canonical}`)
    expect(unreachable).toEqual([])
  })

  it('never maps a key to itself', () => {
    expect(entries.filter(([alias, canonical]) => alias === canonical)).toEqual([])
  })

  it.each([
    ['minced beef', 'ground beef'],
    ['spring onion', 'green onion'],
    ['coriander leaf', 'coriander'],
    ['red pepper flake', 'chili flakes'],
    ['scallion', 'green onion'],
    ['aubergine', 'eggplant'],
    ['courgette', 'zucchini'],
    ['garbanzo', 'chickpea'],
    ['cilantro', 'coriander'],
    ['capsicum', 'bell pepper'],
    ['prawn', 'shrimp'],
    ['pepper', 'black pepper'],
    ['red pepper', 'bell pepper'],
    ['plain flour', 'flour'],
    ['all purpose flour', 'flour'],
    ['caster sugar', 'sugar'],
    ['unsalted butter', 'butter'],
    ['extra virgin olive oil', 'olive oil'],
    ['tomato puree', 'tomato paste'],
    ['egg plant', 'eggplant'],
    ['chicken breast fillet', 'chicken breast'],
    ['double cream', 'heavy cream'],
    ['natural yogurt', 'yogurt'],
    ['broad bean', 'fava bean'],
    ['pitta bread', 'pita'],
    ['cornflour', 'cornstarch'],
    ['icing sugar', 'powdered sugar'],
    ['chicken broth', 'chicken stock'],
    ['vegetable stock cube', 'vegetable stock'],
    ['jute leaf', 'molokhia'],
    ['grape leaf', 'vine leaf'],
    ['peppers', 'bell pepper'],
    ['powdered milk', 'milk powder'],
    ['black lime', 'dried lime'],
    ['little gem', 'little gem lettuce'],
    ['fish finger', 'fish stick'],
    ['cos', 'romaine lettuce'],
  ])('spec alias %s → %s', (alias, canonical) => expect(SYNONYMS[alias]).toBe(canonical))
})

describe('lookupSynonym', () => {
  it('finds whole phrases, ignoring case and spacing', () => {
    expect(lookupSynonym('minced beef')).toBe('ground beef')
    expect(lookupSynonym('  Minced   BEEF ')).toBe('ground beef')
  })

  it.each(['beef', 'minced', 'ground beef', 'constructor', '__proto__', 'hasOwnProperty', ''])(
    'misses %s',
    (phrase) => expect(lookupSynonym(phrase)).toBeUndefined(),
  )
})

describe('SPELLINGS', () => {
  it.each(Object.entries(SPELLINGS))('%s is respelled %s', (variant, fixed) => {
    expect(variant).toMatch(/^[a-z][a-z']*$/)
    expect(fixed).toMatch(/^[a-z][a-z' ]*$/)
    expect(variant).not.toBe(fixed)
  })

  it.each([
    ['chilli', 'chili'],
    ['Mozarella', 'mozzarella'],
    ['Tumeric', 'turmeric'],
    ['Gelatine', 'gelatin'],
    ['zaatar', "za'atar"],
    ['Mloukhia', 'molokhia'],
    ['rosewater', 'rose water'],
    ['brussel sprouts', 'brussels sprout'],
    ['foul medames', 'fava bean'],
    ['fuul', 'fava bean'],
    ['basterma', 'pastirma'],
    ['bastirma', 'pastirma'],
    ['romy cheese', 'roumi'],
    ['chillis', 'chili'],
  ])('normalizes %s to %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
})

describe('CANONICAL_NAMES', () => {
  it('includes the core list, every synonym target, every family member and every staple', () => {
    const expected = [
      ...CORE_CANONICALS,
      ...Object.values(SYNONYMS),
      ...Object.keys(FAMILIES),
      ...Object.values(FAMILIES),
      ...STAPLES,
    ]
    expect(expected.every((name) => CANONICAL_NAMES.has(name))).toBe(true)
  })

  it('lists each core name once', () => {
    expect(new Set(CORE_CANONICALS).size).toBe(CORE_CANONICALS.length)
  })

  it('holds only valid names that are normalizer fixed points', () => {
    const broken = [...CANONICAL_NAMES].filter(
      (name) =>
        !CanonicalNameSchema.safeParse(name).success || normalizeEnglishIngredient(name) !== name,
    )
    expect(broken).toEqual([])
  })

  it('keeps the spec exceptions: coriander and chickpea, not cilantro and garbanzo', () => {
    expect(CANONICAL_NAMES.has('coriander')).toBe(true)
    expect(CANONICAL_NAMES.has('chickpea')).toBe(true)
    expect(CANONICAL_NAMES.has('cilantro')).toBe(false)
    expect(CANONICAL_NAMES.has('garbanzo')).toBe(false)
  })
})
