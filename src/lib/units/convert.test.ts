import { describe, expect, it } from 'vitest'
import { formatAmount, toUnitSystem } from './convert'
import { UNITS, type Unit } from './parse-measure'

describe('toUnitSystem: to metric', () => {
  it.each<[number, Unit, number, Unit]>([
    [1, 'oz', 28, 'g'],
    [0.25, 'oz', 7, 'g'],
    [4, 'oz', 110, 'g'],
    [8, 'oz', 230, 'g'],
    [1, 'lb', 450, 'g'],
    [2, 'lb', 910, 'g'],
    [3, 'lb', 1.4, 'kg'],
    [1, 'cup', 240, 'ml'],
    [0.25, 'cup', 60, 'ml'],
    [1 / 3, 'cup', 80, 'ml'],
    [2 / 3, 'cup', 160, 'ml'],
    [1.5, 'cup', 360, 'ml'],
    [5, 'cup', 1.2, 'l'],
    [2, 'fl oz', 60, 'ml'],
    [1, 'pint', 570, 'ml'],
    [1, 'quart', 950, 'ml'],
    [1, 'gallon', 3.8, 'l'],
  ])('%d %s → %d %s', (amount, unit, expectedAmount, expectedUnit) => {
    expect(toUnitSystem(amount, unit, 'metric')).toEqual({
      amount: expectedAmount,
      unit: expectedUnit,
    })
  })

  it('rounds small results to the nearest 0.5', () => {
    expect(toUnitSystem(0.125, 'oz', 'metric')).toEqual({ amount: 3.5, unit: 'g' })
    expect(toUnitSystem(0.3, 'fl oz', 'metric')).toEqual({ amount: 9, unit: 'ml' })
  })

  it('switches to kg / l when rounding reaches 1000', () => {
    expect(toUnitSystem(35.27, 'oz', 'metric')).toEqual({ amount: 1, unit: 'kg' })
    expect(toUnitSystem(4.17, 'cup', 'metric')).toEqual({ amount: 1, unit: 'l' })
  })
})

describe('toUnitSystem: to US customary ("imperial")', () => {
  it.each<[number, Unit, number, Unit]>([
    [100, 'g', 3.5, 'oz'],
    [250, 'g', 8.75, 'oz'],
    [28, 'g', 1, 'oz'],
    [300, 'g', 11, 'oz'],
    [450, 'g', 1, 'lb'],
    [500, 'g', 1, 'lb'],
    [700, 'g', 1.5, 'lb'],
    [1, 'kg', 2.25, 'lb'],
    [2.5, 'kg', 5.5, 'lb'],
    [5, 'kg', 11, 'lb'],
    [5, 'ml', 1, 'tsp'],
    [2.5, 'ml', 0.5, 'tsp'],
    [0.6, 'ml', 0.125, 'tsp'],
    [15, 'ml', 1, 'tbsp'],
    [50, 'ml', 3.5, 'tbsp'],
    [60, 'ml', 0.25, 'cup'],
    [80, 'ml', 1 / 3, 'cup'],
    [150, 'ml', 2 / 3, 'cup'],
    [250, 'ml', 1, 'cup'],
    [1, 'l', 4.25, 'cup'],
    [3, 'l', 13, 'cup'],
    [2, 'dl', 0.75, 'cup'],
    [5, 'cl', 3.5, 'tbsp'],
  ])('%d %s → %d %s', (amount, unit, expectedAmount, expectedUnit) => {
    expect(toUnitSystem(amount, unit, 'imperial')).toEqual({
      amount: expectedAmount,
      unit: expectedUnit,
    })
  })

  it('refuses a conversion no kitchen amount is within 25 % of', () => {
    // 10 g is 0.35 oz: ¼ oz is 29 % off and ½ oz 42 % off.
    expect(toUnitSystem(10, 'g', 'imperial')).toBeNull()
    expect(toUnitSystem(2, 'g', 'imperial')).toBeNull()
    expect(toUnitSystem(500, 'mg', 'imperial')).toBeNull()
    expect(toUnitSystem(0.1, 'ml', 'imperial')).toBeNull()
    expect(toUnitSystem(0.2, 'oz', 'imperial')).toEqual({ amount: 0.2, unit: 'oz' })
    expect(toUnitSystem(0.005, 'oz', 'metric')).toBeNull()
  })

  it('accepts a rounding exactly 25 % off (1 ml → ¼ tsp)', () => {
    expect(toUnitSystem(1, 'ml', 'imperial')).toEqual({ amount: 0.25, unit: 'tsp' })
  })
})

describe('toUnitSystem: no conversion', () => {
  it('returns amounts already in the wanted system untouched', () => {
    expect(toUnitSystem(1500, 'g', 'metric')).toEqual({ amount: 1500, unit: 'g' })
    expect(toUnitSystem(0.5, 'cup', 'imperial')).toEqual({ amount: 0.5, unit: 'cup' })
    expect(toUnitSystem(16, 'oz', 'imperial')).toEqual({ amount: 16, unit: 'oz' })
    expect(toUnitSystem(2, 'pint', 'imperial')).toEqual({ amount: 2, unit: 'pint' })
  })

  it('never converts spoons, which metric and US cooks share', () => {
    for (const system of ['metric', 'imperial'] as const) {
      expect(toUnitSystem(1, 'tsp', system)).toEqual({ amount: 1, unit: 'tsp' })
      expect(toUnitSystem(2.5, 'tbsp', system)).toEqual({ amount: 2.5, unit: 'tbsp' })
    }
  })

  const notMassOrVolume = UNITS.filter(
    (unit) =>
      ![
        'mg',
        'g',
        'kg',
        'oz',
        'lb',
        'ml',
        'cl',
        'dl',
        'l',
        'tsp',
        'tbsp',
        'fl oz',
        'cup',
        'pint',
        'quart',
        'gallon',
      ].includes(unit),
  )

  it.each(notMassOrVolume)('returns null for %s (counts, containers, lengths)', (unit) => {
    expect(toUnitSystem(2, unit, 'metric')).toBeNull()
    expect(toUnitSystem(2, unit, 'imperial')).toBeNull()
  })

  it('returns null for an amount that is not positive', () => {
    expect(toUnitSystem(0, 'g', 'imperial')).toBeNull()
    expect(toUnitSystem(-1, 'cup', 'metric')).toBeNull()
    expect(toUnitSystem(Number.NaN, 'cup', 'metric')).toBeNull()
  })
})

describe('formatAmount', () => {
  it.each([
    [0.5, '½'],
    [1.25, '1¼'],
    [0.333, '⅓'],
    [1 / 3, '⅓'],
    [2 / 3, '⅔'],
    [0.75, '¾'],
    [0.125, '⅛'],
    [2.375, '2⅜'],
    [0.625, '⅝'],
    [3.875, '3⅞'],
    [8.75, '8¾'],
    [1, '1'],
    [12, '12'],
    [1.004, '1'],
    [1.996, '2'],
  ])('%d → %s', (amount, text) => {
    expect(formatAmount(amount)).toBe(text)
  })

  it('writes other amounts as decimals with at most 2 places', () => {
    expect(formatAmount(1.4)).toBe('1.4')
    expect(formatAmount(0.3)).toBe('0.3')
    expect(formatAmount(2.137)).toBe('2.14')
  })

  it('uses decimals for metric units', () => {
    expect(formatAmount(2.5, 'ml')).toBe('2.5')
    expect(formatAmount(1.5, 'kg')).toBe('1.5')
    expect(formatAmount(240, 'ml')).toBe('240')
    expect(formatAmount(1.25, 'l')).toBe('1.25')
    expect(formatAmount(0.5, 'cup')).toBe('½')
  })

  it('uses Western digits', () => {
    expect(formatAmount(1234.5, 'g')).toMatch(/^[0-9.]+$/)
  })
})

describe('parse → convert → format', () => {
  it('turns TheMealDB measures into display text', () => {
    const show = (amount: number, unit: Unit, system: 'metric' | 'imperial') => {
      const quantity = toUnitSystem(amount, unit, system)
      return quantity && `${formatAmount(quantity.amount, quantity.unit)} ${quantity.unit}`
    }
    expect(show(1, 'cup', 'metric')).toBe('240 ml')
    expect(show(100, 'g', 'imperial')).toBe('3½ oz')
    expect(show(1.5, 'kg', 'imperial')).toBe('3¼ lb')
    expect(show(400, 'ml', 'imperial')).toBe('1⅔ cup')
    expect(show(3, 'lb', 'metric')).toBe('1.4 kg')
  })
})
