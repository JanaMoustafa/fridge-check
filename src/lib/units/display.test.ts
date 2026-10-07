import { describe, expect, it } from 'vitest'
import { convertForDisplay, systemOf, unitMessageKey } from './display'

describe('systemOf', () => {
  it.each([
    ['g', 'metric'],
    ['ml', 'metric'],
    ['cup', 'imperial'],
    ['lb', 'imperial'],
    ['tbsp', null],
    ['clove', null],
  ] as const)('%s → %s', (unit, system) => expect(systemOf(unit)).toBe(system))
})

describe('convertForDisplay', () => {
  it('converts a US line for a metric reader', () => {
    expect(convertForDisplay({ amount: 1, unit: 'cup' }, 'metric')).toEqual({
      amount: 240,
      unit: 'ml',
    })
  })

  it('converts a metric line for a US reader', () => {
    expect(convertForDisplay({ amount: 500, unit: 'g' }, 'imperial')).toEqual({
      amount: 1,
      unit: 'lb',
    })
  })

  it.each([
    ['already in the preferred system', { amount: 200, unit: 'g' }, 'metric'],
    ['a spoon measure', { amount: 2, unit: 'tbsp' }, 'metric'],
    ['a count', { amount: 3, unit: 'clove' }, 'imperial'],
    ['no amount', { unit: 'g' }, 'imperial'],
    ['no unit', { amount: 2 }, 'imperial'],
    ['an unknown unit', { amount: 2, unit: 'smidgen' }, 'imperial'],
    ['an amount that would round dishonestly', { amount: 2, unit: 'g' }, 'imperial'],
  ] as const)('shows nothing for %s', (_label, line, system) => {
    expect(convertForDisplay(line, system)).toBeNull()
  })
})

describe('unitMessageKey', () => {
  it('makes message-safe keys', () => {
    expect(unitMessageKey('fl oz')).toBe('fl-oz')
    expect(unitMessageKey('g')).toBe('g')
  })
})
