import { describe, expect, it } from 'vitest'
import {
  isCanonicalName,
  normalizeIngredient,
  resolveIngredient,
  splitIngredientInput,
} from './normalize'

describe('normalizeIngredient', () => {
  it.each([
    ['Tomatoes', 'tomato'],
    ['2 large ripe tomatoes, diced', 'tomato'],
    ['1 x 400g tin chopped tomatoes', 'tomato'],
    ['Minced Beef', 'ground beef'],
    ['Egg Plants', 'eggplant'],
    ['Crème fraîche', 'creme fraiche'],
    ['spring onions', 'green onion'],
  ])('sends English %j to the English pipeline → %j', (raw, canonical) => {
    expect(normalizeIngredient(raw)).toBe(canonical)
  })

  it.each([
    ['طماطم', 'tomato'],
    ['٢ طماطم كبيرة مقطعة', 'tomato'],
    ['بصل أخضر', 'green onion'],
    ['لحم مفروم ١ كيلو', 'ground beef'],
    ['جبنة', 'cheese'],
    ['ملح وفلفل', 'salt'],
  ])('sends Arabic %j to the Arabic pipeline → %j', (raw, canonical) => {
    expect(normalizeIngredient(raw)).toBe(canonical)
  })

  it('sends mixed Latin and Arabic text to the Arabic pipeline', () => {
    expect(normalizeIngredient('chicken صدور')).toBe('chicken breast')
  })

  it.each([
    ['٢ tomatoes', 'tomato'],
    ['tomato،', 'tomato'],
    ['٣ eggs؛', 'egg'],
  ])('reads %j as English once Arabic digits and punctuation fold away', (raw, canonical) => {
    expect(normalizeIngredient(raw)).toBe(canonical)
  })

  it.each([
    ['كرسي', 'كرسي'],
    ['ـــكرسيـــ', 'كرسي'],
    ['سَلَطَةٌ مجهولة', 'سلطه مجهوله'],
    ['٢ كرسي', '2 كرسي'],
  ])('returns unknown Arabic %j folded (%j), not canonical', (raw, folded) => {
    const result = normalizeIngredient(raw)
    expect(result).toBe(folded)
    expect(isCanonicalName(result)).toBe(false)
  })

  it.each(['', '   ', '2 large', 'to taste', '1 tbsp', '🍅'])(
    'returns "" for English %j with no ingredient in it',
    (raw) => {
      expect(normalizeIngredient(raw)).toBe('')
    },
  )
})

describe('resolveIngredient', () => {
  it('normalizes a full recipe line and marks it changed', () => {
    expect(resolveIngredient('2 large ripe tomatoes, diced')).toEqual({
      input: '2 large ripe tomatoes, diced',
      canonical: 'tomato',
      changed: true,
    })
  })

  it.each([
    ['tomato', 'tomato', false],
    ['Tomato', 'tomato', false],
    ['  tomato  ', 'tomato', false],
    ['Tomatoes', 'tomato', true],
    ['TOMATOES', 'tomato', true],
    ['aubergine', 'eggplant', true],
    ['green  onion', 'green onion', true],
    ["za'atar", "za'atar", false],
    ['self-raising flour', 'self-raising flour', false],
  ])('%j → %j (changed: %s)', (raw, canonical, changed) => {
    expect(resolveIngredient(raw)).toEqual({ input: raw.trim(), canonical, changed })
  })

  it('always marks Arabic input changed, since the canonical name is English', () => {
    expect(resolveIngredient(' بصل أخضر ')).toEqual({
      input: 'بصل أخضر',
      canonical: 'green onion',
      changed: true,
    })
  })

  it.each(['كرسي', 'سَلَطَةٌ مجهولة', '٢ كرسي'])(
    'gives unknown Arabic %j no canonical name',
    (raw) => {
      expect(resolveIngredient(raw)).toEqual({ input: raw, canonical: null, changed: false })
    },
  )

  it.each([
    ['', ''],
    ['   ', ''],
    ['\n\t', ''],
    ['2 large', '2 large'],
    [' to taste ', 'to taste'],
    ['🍅', '🍅'],
  ])('gives %j nothing to resolve', (raw, input) => {
    expect(resolveIngredient(raw)).toEqual({ input, canonical: null, changed: false })
  })

  it('only returns canonical names', () => {
    const inputs = ['Freshly Chopped Parsley', 'Tomato Purée', 'Red Pepper Flakes', 'فلفل رومي']
    for (const raw of inputs) {
      const { canonical } = resolveIngredient(raw)
      expect(canonical).not.toBeNull()
      expect(isCanonicalName(canonical as string)).toBe(true)
    }
  })
})

describe('splitIngredientInput', () => {
  it.each([
    ['tomato, onion', ['tomato', 'onion']],
    ['tomato,onion,,garlic', ['tomato', 'onion', 'garlic']],
    ['tomato; onion', ['tomato', 'onion']],
    ['طماطم، بصل', ['طماطم', 'بصل']],
    ['طماطم؛ بصل', ['طماطم', 'بصل']],
    ['tomato\nonion', ['tomato', 'onion']],
    ['tomato\r\nonion\r\n', ['tomato', 'onion']],
    ['tomato\ronion', ['tomato', 'onion']],
    ['  tomato  \n\n\n  onion  ', ['tomato', 'onion']],
  ])('splits %j', (text, parts) => {
    expect(splitIngredientInput(text)).toEqual(parts)
  })

  it.each(['salt and pepper', 'mac and cheese', 'ملح وفلفل', 'ملح و فلفل'])(
    'keeps %j whole: "and" / "و" is part of a name, not a separator',
    (text) => {
      expect(splitIngredientInput(text)).toEqual([text])
    },
  )

  it.each([
    ['1,5 kg flour, sugar', ['1,5 kg flour', 'sugar']],
    ['1,000 g flour', ['1,000 g flour']],
    ['١,٥ كيلو دقيق، سكر', ['١,٥ كيلو دقيق', 'سكر']],
    ['eggs,2 tomatoes', ['eggs', '2 tomatoes']],
    ['tomatoes 2,eggs', ['tomatoes 2', 'eggs']],
  ])('keeps a comma between digits as a number in %j', (text, parts) => {
    expect(splitIngredientInput(text)).toEqual(parts)
  })

  it('keeps order and duplicates for the UI to dedupe after normalizing', () => {
    expect(splitIngredientInput('egg, Eggs, egg, بيض')).toEqual(['egg', 'Eggs', 'egg', 'بيض'])
  })

  it.each(['', '   ', ',', ' , ;\n، ؛ \r\n '])('returns [] for %j', (text) => {
    expect(splitIngredientInput(text)).toEqual([])
  })

  it('feeds resolveIngredient: a pasted bilingual list becomes canonical names', () => {
    const pasted = '2 large ripe tomatoes\nبصل أخضر، Minced Beef; كزبرة خضراء\r\ngarbanzo beans'
    expect(splitIngredientInput(pasted).map((part) => resolveIngredient(part).canonical)).toEqual([
      'tomato',
      'green onion',
      'ground beef',
      'coriander',
      'chickpea',
    ])
  })
})

describe('isCanonicalName', () => {
  it.each(['tomato', 'green onion', "za'atar", 'self-raising flour', '7 spice', 'a'.repeat(60)])(
    'accepts %j',
    (value) => {
      expect(isCanonicalName(value)).toBe(true)
    },
  )

  it.each([
    '',
    'Tomato',
    ' tomato',
    '-tomato',
    "'tomato",
    'tomato!',
    'crème fraîche',
    'طماطم',
    'a'.repeat(61),
  ])('rejects %j', (value) => {
    expect(isCanonicalName(value)).toBe(false)
  })
})
