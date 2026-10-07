import { describe, expect, it } from 'vitest'
import { singularizeLast, singularizeWord } from './singularize'

describe('singularizeWord', () => {
  it.each([
    ['tomatoes', 'tomato'],
    ['potatoes', 'potato'],
    ['mangoes', 'mango'],
    ['avocadoes', 'avocado'],
    ['avocados', 'avocado'],
    ['leaves', 'leaf'],
    ['halves', 'half'],
    ['loaves', 'loaf'],
    ['knives', 'knife'],
    ['berries', 'berry'],
    ['cherries', 'cherry'],
    ['anchovies', 'anchovy'],
    ['peaches', 'peach'],
    ['radishes', 'radish'],
    ['boxes', 'box'],
    ['glasses', 'glass'],
    ['olives', 'olive'],
    ['chives', 'chive'],
    ['cloves', 'clove'],
    ['onions', 'onion'],
    ['eggs', 'egg'],
    ['jalapenos', 'jalapeno'],
    ['bananas', 'banana'],
    ['cheeses', 'cheese'],
    ['cookies', 'cookie'],
    ['pies', 'pie'],
    ['chilies', 'chili'],
    ['chillies', 'chilli'],
    ['quiches', 'quiche'],
    // -is is a plural ending too: only the words listed as invariant keep it.
    ['kiwis', 'kiwi'],
    ['chilis', 'chili'],
    ['zucchinis', 'zucchini'],
    ['salamis', 'salami'],
    ['rotis', 'roti'],
    ['chapatis', 'chapati'],
  ])('%s → %s', (plural, singular) => expect(singularizeWord(plural)).toBe(singular))

  it.each([
    'hummus',
    'couscous',
    'asparagus',
    'molasses',
    'swiss',
    'bass',
    'lemongrass',
    'watercress',
    'citrus',
    'oats',
    'rice',
    'fish',
    'octopus',
    'haggis',
    'tahini',
    'bulgur',
    'freekeh',
    'grits',
    'fries',
    'species',
    'pastis',
    'frais',
    'pois',
    'anis',
    'cassis',
    'coulis',
    'gris',
    'gras',
    'medames',
    'cos',
    'dibs',
    'brebis',
    'chablis',
    'patis',
    'manis',
    'propolis',
    "baker's",
    'tomato',
    'as',
  ])('keeps %s unchanged', (word) => expect(singularizeWord(word)).toBe(word))
})

describe('singularizeLast', () => {
  it.each([
    ['cherry tomatoes', 'cherry tomato'],
    ['brussels sprouts', 'brussels sprout'],
    ['bay leaves', 'bay leaf'],
    ['chicken thighs', 'chicken thigh'],
    ['swiss chard', 'swiss chard'],
    ['pomegranate molasses', 'pomegranate molasses'],
    ['eggs', 'egg'],
    ['foie gras', 'foie gras'],
    ['fromage frais', 'fromage frais'],
    ['red chilis', 'red chili'],
  ])('%s → %s', (phrase, singular) => expect(singularizeLast(phrase)).toBe(singular))

  it('only touches the head noun', () => {
    expect(singularizeLast('peas and carrots')).toBe('peas and carrot')
  })
})
