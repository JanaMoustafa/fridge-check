import { describe, expect, it } from 'vitest'
import { UNITS, isUnit, parseMeasure } from './parse-measure'

// Every input below is a real TheMealDB strMeasure (spacing and case as published).

describe('parseMeasure: amount and unit', () => {
  it.each([
    ['1 tsp', 1, 'tsp'],
    ['1 tsp ', 1, 'tsp'],
    ['1tsp', 1, 'tsp'],
    ['2 tablespoons', 2, 'tbsp'],
    ['3  tablespoons', 3, 'tbsp'],
    ['2 tbs', 2, 'tbsp'],
    ['1 tblsp ', 1, 'tbsp'],
    ['1 tbls', 1, 'tbsp'],
    ['4 Tablespoons', 4, 'tbsp'],
    ['3tbsp', 3, 'tbsp'],
    ['1 cup', 1, 'cup'],
    ['3 Cups', 3, 'cup'],
    ['1 cups', 1, 'cup'],
    ['100g ', 100, 'g'],
    ['200 g', 200, 'g'],
    ['250 Grams', 250, 'g'],
    ['1kg', 1, 'kg'],
    ['1.5kg', 1.5, 'kg'],
    ['1 lb', 1, 'lb'],
    ['2 Lbs', 2, 'lb'],
    ['2 Pounds', 2, 'lb'],
    ['8 oz ', 8, 'oz'],
    ['12 ounces', 12, 'oz'],
    ['150ml', 150, 'ml'],
    ['50 ml ', 50, 'ml'],
    ['1 L ', 1, 'l'],
    ['1.5L', 1.5, 'l'],
    ['2 Litres', 2, 'l'],
    ['1 Litre', 1, 'l'],
    ['1 quart', 1, 'quart'],
    ['4 qt ', 4, 'quart'],
    ['2 pint ', 2, 'pint'],
    ['1 pinch', 1, 'pinch'],
    ['2 pinches', 2, 'pinch'],
    ['1 dash', 1, 'dash'],
    ['5 drops', 5, 'drop'],
    ['1 knob', 1, 'knob'],
    ['2 Handfuls', 2, 'handful'],
    ['2 handfulls', 2, 'handful'],
    ['1 Handfull', 1, 'handful'],
    ['1 scoop', 1, 'scoop'],
    ['3 shots ', 3, 'shot'],
    ['1 Can', 1, 'can'],
    ['3 cans', 3, 'can'],
    ['1 tin ', 1, 'tin'],
    ['1 Jar', 1, 'jar'],
    ['1 bottle', 1, 'bottle'],
    ['1 Packet', 1, 'packet'],
    ['1 package thin', 1, 'packet'],
    ['1/2 bag', 0.5, 'bag'],
    ['2 tubs', 2, 'tub'],
    ['1 pot', 1, 'pot'],
    ['2 cloves', 2, 'clove'],
    ['1 Slice', 1, 'slice'],
    ['2 pieces ', 2, 'piece'],
    ['1  bunch', 1, 'bunch'],
    ['4 sprigs', 4, 'sprig'],
    ['1 Stick', 1, 'stick'],
    ['1 Stalk', 1, 'stalk'],
    ['4 leaves', 4, 'leaf'],
    ['1 head', 1, 'head'],
    ['1 Bulb', 1, 'bulb'],
    ['4 fillets', 4, 'fillet'],
    ['2 strips', 2, 'strip'],
    ['3 Pods', 3, 'pod'],
    ['12 florets', 12, 'floret'],
    ['2 parts ', 2, 'part'],
    ['3cm piece', 3, 'cm'],
    ['1 inch', 1, 'inch'],
  ])('%j → %d %s', (measure, amount, unit) => {
    expect(parseMeasure(measure)).toEqual({ amount, unit })
  })
})

describe('parseMeasure: amounts', () => {
  it.each([
    ['1/2 tsp', 0.5],
    ['1/8 teaspoon', 0.125],
    ['½ cup ', 0.5],
    ['¼ teaspoon', 0.25],
    ['¾ cup', 0.75],
    ['1 ½ tbsp', 1.5],
    ['1½ kg', 1.5],
    ['2½ tbsp', 2.5],
    ['1 1/2 cups ', 1.5],
    ['2 1/4 cups', 2.25],
    ['2-1/2 cups', 2.5],
    ['1-½ cups', 1.5],
    ['1 and 1/8 cup', 1.125],
    ['0.5', 0.5],
    ['2.5 tbsp', 2.5],
  ])('%j → %d', (measure, amount) => {
    expect(parseMeasure(measure).amount).toBeCloseTo(amount, 10)
  })

  it('reads thirds exactly enough to format them', () => {
    expect(parseMeasure('1/3 cup').amount).toBeCloseTo(1 / 3, 10)
    expect(parseMeasure('1-⅓ cups')).toEqual({ amount: 1 + 1 / 3, unit: 'cup' })
    expect(parseMeasure('2/3 Cup')).toEqual({ amount: 2 / 3, unit: 'cup' })
  })

  it.each([
    ['1', 1],
    ['2 ', 2],
    ['24', 24],
    ['½', 0.5],
    ['1/2 ', 0.5],
    ['1 1/2 ', 1.5],
    ['¼', 0.25],
    ['0.25', 0.25],
  ])('a bare number is a count: %j → %d', (measure, amount) => {
    expect(parseMeasure(measure)).toEqual({ amount })
  })

  it('takes the first number of a range', () => {
    expect(parseMeasure('2-3 tbsp')).toEqual({ amount: 2, unit: 'tbsp' })
    expect(parseMeasure('1-2tbsp')).toEqual({ amount: 1, unit: 'tbsp' })
    expect(parseMeasure('4-5 pound')).toEqual({ amount: 4, unit: 'lb' })
    expect(parseMeasure('6-8 slices')).toEqual({ amount: 6, unit: 'slice' })
    expect(parseMeasure('4 - 6')).toEqual({ amount: 4 })
    expect(parseMeasure('4-6')).toEqual({ amount: 4 })
    expect(parseMeasure('2 to 3 cups')).toEqual({ amount: 2, unit: 'cup' })
    expect(parseMeasure('1 or 2 cloves')).toEqual({ amount: 1, unit: 'clove' })
  })

  it('drops an approximation word in front', () => {
    expect(parseMeasure('about 2 cups')).toEqual({ amount: 2, unit: 'cup' })
    expect(parseMeasure('Approx. 500g')).toEqual({ amount: 500, unit: 'g' })
  })
})

describe('parseMeasure: extra text', () => {
  it.each([
    ['1 chopped', { amount: 1 }],
    ['1 large', { amount: 1 }],
    ['2 Beaten ', { amount: 2 }],
    ['1 red', { amount: 1 }],
    ['24 Skinned', { amount: 24 }],
    ['2 free-range', { amount: 2 }],
    ['1 whole', { amount: 1 }],
    ['5 chopped cloves', { amount: 5 }],
    ['2 cloves minced', { amount: 2, unit: 'clove' }],
    ['4 Cloves Crushed', { amount: 4, unit: 'clove' }],
    ['1 clove, peeled and crushed', { amount: 1, unit: 'clove' }],
    ['2 tsp ground', { amount: 2, unit: 'tsp' }],
    ['3 tsp Dried', { amount: 3, unit: 'tsp' }],
    ['450 grams Boneless skin', { amount: 450, unit: 'g' }],
    ['100ml milk', { amount: 100, unit: 'ml' }],
    ['1 litre hot', { amount: 1, unit: 'l' }],
    ['14 oz jar', { amount: 14, unit: 'oz' }],
    ['400g can', { amount: 400, unit: 'g' }],
    ['½ tsp dissolved in ½ cup warm milk', { amount: 0.5, unit: 'tsp' }],
  ])('reads only the amount and unit of %j', (measure, expected) => {
    expect(parseMeasure(measure)).toEqual(expected)
  })

  it('reads size words between the amount and the unit', () => {
    expect(parseMeasure('2 small stalks')).toEqual({ amount: 2, unit: 'stalk' })
    expect(parseMeasure('4 thick slices')).toEqual({ amount: 4, unit: 'slice' })
    expect(parseMeasure('6 medium cloves sliced')).toEqual({ amount: 6, unit: 'clove' })
    expect(parseMeasure('1 fresh sprig')).toEqual({ amount: 1, unit: 'sprig' })
    expect(parseMeasure('1 heaped tbsp')).toEqual({ amount: 1, unit: 'tbsp' })
  })

  it('takes the first of two systems: "50g/1¾oz", "6oz/180g", "350ml/12fl"', () => {
    expect(parseMeasure('50g/1¾oz')).toEqual({ amount: 50, unit: 'g' })
    expect(parseMeasure('175g/6oz')).toEqual({ amount: 175, unit: 'g' })
    expect(parseMeasure('6oz/180g')).toEqual({ amount: 6, unit: 'oz' })
    expect(parseMeasure('350ml/12fl')).toEqual({ amount: 350, unit: 'ml' })
    expect(parseMeasure('650g/1lb 8 oz')).toEqual({ amount: 650, unit: 'g' })
  })

  it('ignores parentheses: "1 (400g) tin", "8 ounces (230 grams)"', () => {
    expect(parseMeasure('1 (400g) tin')).toEqual({ amount: 1, unit: 'tin' })
    expect(parseMeasure('1 (200g) pack')).toEqual({ amount: 1, unit: 'packet' })
    expect(parseMeasure('8 ounces (230 grams)')).toEqual({ amount: 8, unit: 'oz' })
    expect(parseMeasure('1 1/2 cups (360 milliliters)')).toEqual({ amount: 1.5, unit: 'cup' })
    expect(parseMeasure('3 rashers (100g) chopped dry-cured')).toEqual({
      amount: 3,
      unit: 'rasher',
    })
    expect(parseMeasure('2 (460g)')).toEqual({ amount: 2 })
    expect(parseMeasure('1 (12 oz.)')).toEqual({ amount: 1 })
    expect(parseMeasure('drizzle (for cooking')).toEqual({ amount: 1, unit: 'drizzle' })
  })

  it('reads fluid ounces in every spelling', () => {
    expect(parseMeasure('2 fl oz')).toEqual({ amount: 2, unit: 'fl oz' })
    expect(parseMeasure('2 fl. oz.')).toEqual({ amount: 2, unit: 'fl oz' })
    expect(parseMeasure('16floz')).toEqual({ amount: 16, unit: 'fl oz' })
    expect(parseMeasure('3 fluid ounces')).toEqual({ amount: 3, unit: 'fl oz' })
  })

  it('reads a hyphenated size as the unit: "8-ounce sliced"', () => {
    expect(parseMeasure('8-ounce sliced')).toEqual({ amount: 8, unit: 'oz' })
  })

  it('does not read "1 – 14-ounce can" as 1 oz', () => {
    expect(parseMeasure('1 – 14-ounce can')).toEqual({ amount: 1 })
  })
})

describe('parseMeasure: packs', () => {
  it('multiplies a count of packs of a stated mass or volume', () => {
    expect(parseMeasure('2 x 400g')).toEqual({ amount: 800, unit: 'g' })
    expect(parseMeasure('2 x 400g tins')).toEqual({ amount: 800, unit: 'g' })
    expect(parseMeasure('1 x 300ml')).toEqual({ amount: 300, unit: 'ml' })
    expect(parseMeasure('3 400g Cans')).toEqual({ amount: 1200, unit: 'g' })
    expect(parseMeasure('2×400g')).toEqual({ amount: 800, unit: 'g' })
  })

  it('keeps the count when the pack size is not a mass or volume (52791 meringue nests)', () => {
    expect(parseMeasure('3 x 7.5cm')).toEqual({ amount: 3 })
    expect(parseMeasure('2 x 3')).toEqual({ amount: 2 })
  })
})

describe('parseMeasure: no number', () => {
  it.each([
    ['Pinch', 'pinch'],
    ['pinch ', 'pinch'],
    ['Dash', 'dash'],
    ['Splash', 'splash'],
    ['Drizzle', 'drizzle'],
    ['Knob', 'knob'],
    ['Handful', 'handful'],
    ['handfull', 'handful'],
    ['Large handful', 'handful'],
    ['Bunch', 'bunch'],
    ['Small bunch', 'bunch'],
    ['Small pack', 'packet'],
    ['Can', 'can'],
    ['Bottle', 'bottle'],
    ['Sprinkling', 'sprinkle'],
    ['spinkling', 'sprinkle'],
    ['Pod of', 'pod'],
    ['a pinch', 'pinch'],
    ['an envelope', 'packet'],
  ])('a singular unit alone means one: %j', (measure, unit) => {
    expect(parseMeasure(measure)).toEqual({ amount: 1, unit })
  })

  it('a plural unit alone names the unit but not the amount', () => {
    expect(parseMeasure('Leaves')).toEqual({ unit: 'leaf' })
    expect(parseMeasure('Sprigs of fresh')).toEqual({ unit: 'sprig' })
  })

  it.each([
    'To taste',
    'to taste',
    'grated, to taste',
    'To serve',
    'For frying',
    'Juice of 1',
    'Juice of 1/2',
    'Zest and juice of 1',
    'Juice/zest of one',
    'The juice and zest of one',
    'Garnish',
    'Garnish with',
    'Chopped',
    'Dusting',
    'Grating',
    'Top',
    'Half',
    'As required',
    'Thumb sized peeled and very finely grated',
    'Fresh',
    '',
    ' ',
  ])('a descriptive measure is {}: %j', (measure) => {
    expect(parseMeasure(measure)).toEqual({})
  })
})

describe('parseMeasure: refusals', () => {
  it('rejects letters glued to the number that are not a unit ("3rd" of a cucumber)', () => {
    expect(parseMeasure('3rd')).toEqual({})
    expect(parseMeasure('2nd')).toEqual({})
  })

  it('rejects a comma after the number (decimal comma or thousands separator)', () => {
    expect(parseMeasure('1,5 kg')).toEqual({})
    expect(parseMeasure('1,000g')).toEqual({})
  })

  it('never returns an amount of 0', () => {
    expect(parseMeasure('0')).toEqual({})
    expect(parseMeasure('0 g')).toEqual({})
    expect(parseMeasure('0 x 400g')).toEqual({})
    expect(parseMeasure('0/2 cup')).toEqual({})
  })

  it('does not read a zero denominator as a fraction', () => {
    expect(parseMeasure('1/0 cup')).toEqual({ amount: 1 })
  })
})

describe('UNITS', () => {
  it('has no duplicates and every unit is recognised by isUnit', () => {
    expect(new Set(UNITS).size).toBe(UNITS.length)
    for (const unit of UNITS) expect(isUnit(unit)).toBe(true)
  })

  it('isUnit rejects spellings that are not canonical keys', () => {
    expect(isUnit('tablespoon')).toBe(false)
    expect(isUnit('cups')).toBe(false)
    expect(isUnit('')).toBe(false)
  })

  it.each(UNITS)('%s parses back to itself after an amount', (unit) => {
    expect(parseMeasure(`2 ${unit}`)).toEqual({ amount: 2, unit })
  })
})
