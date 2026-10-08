import { describe, expect, it } from 'vitest'
import { parseProfileForm, readNumber } from './profile'

const TODAY = new Date('2026-10-08T12:00:00Z')
const valid = {
  weightKg: '72.5',
  heightCm: '168',
  birthYear: '1994',
  sex: 'female',
  activityLevel: 'moderate',
  goal: 'lose_fat',
  breakfast: '25',
  lunch: '35',
  dinner: '30',
  snacks: '10',
  consent: 'on',
}

describe('readNumber', () => {
  it.each([
    ['72.5', 72.5],
    ['72,5', 72.5],
    [' 168 ', 168],
    ['٧٢٫٥', 72.5],
    ['١٩٩٤', 1994],
    ['', undefined],
    [undefined, undefined],
  ])('%j → %s', (input, expected) => {
    expect(readNumber(input)).toBe(expected)
  })

  it('reads anything else as NaN', () => {
    expect(readNumber('seventy')).toBeNaN()
  })
})

describe('parseProfileForm', () => {
  it('returns typed values, rounded to one decimal', () => {
    expect(parseProfileForm({ ...valid, weightKg: '72.46', heightCm: '168.04' }, TODAY)).toEqual({
      ok: true,
      values: {
        weightKg: 72.5,
        heightCm: 168,
        birthYear: 1994,
        sex: 'female',
        activityLevel: 'moderate',
        goal: 'lose_fat',
        mealSplit: { breakfast: 25, lunch: 35, dinner: 30, snacks: 10 },
      },
    })
  })

  it('uses the default meal split when it is left blank', () => {
    const blank = { ...valid, breakfast: '', lunch: '', dinner: '', snacks: '' }
    const result = parseProfileForm(blank, TODAY)
    expect(result.ok && result.values.mealSplit).toEqual({
      breakfast: 25,
      lunch: 35,
      dinner: 30,
      snacks: 10,
    })
  })

  it('reports every problem at once, by field', () => {
    expect(parseProfileForm({}, TODAY)).toEqual({
      ok: false,
      errors: {
        weightKg: 'required',
        heightCm: 'required',
        birthYear: 'required',
        sex: 'required',
        activityLevel: 'required',
        goal: 'required',
        consent: 'consent',
      },
    })
  })

  it.each([
    ['weightKg', '29', 'range'],
    ['weightKg', '301', 'range'],
    ['weightKg', 'lots', 'range'],
    ['heightCm', '119', 'range'],
    ['birthYear', '2009', 'age'], // 17 this year
    ['birthYear', '1945', 'age'], // 81 this year
    ['birthYear', '1994.5', 'range'],
    ['sex', 'other', 'required'],
    ['goal', 'bulk', 'required'],
    ['consent', 'yes', 'consent'],
  ])('rejects %s = %j as %s', (field, value, error) => {
    const result = parseProfileForm({ ...valid, [field]: value }, TODAY)
    expect(result).toEqual({ ok: false, errors: { [field]: error } })
  })

  it('accepts the edges of every range (18 and 80 this year)', () => {
    for (const change of [
      { birthYear: '2008' },
      { birthYear: '1946' },
      { weightKg: '30', heightCm: '230' },
    ]) {
      expect(parseProfileForm({ ...valid, ...change }, TODAY).ok).toBe(true)
    }
  })

  it('needs a meal split of whole percentages that adds up to 100', () => {
    expect(parseProfileForm({ ...valid, snacks: '15' }, TODAY)).toEqual({
      ok: false,
      errors: { mealSplit: 'mealSplit' },
    })
    expect(parseProfileForm({ ...valid, snacks: '' }, TODAY)).toEqual({
      ok: false,
      errors: { mealSplit: 'mealSplit' },
    })
    expect(parseProfileForm({ ...valid, breakfast: '20', snacks: '15' }, TODAY).ok).toBe(true)
  })
})
