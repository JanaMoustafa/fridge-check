import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_LEVELS,
  ACTIVITY_MULTIPLIERS,
  ageFromBirthYear,
  assertValidProfile,
  bmr,
  calculateTargets,
  calorieTarget,
  FORMULA_VERSION,
  GOALS,
  KCAL_PER_GRAM,
  SEXES,
  tdee,
  type ProfileInput,
} from './calculator'

const woman: ProfileInput = {
  weightKg: 65,
  heightCm: 165,
  age: 30,
  sex: 'female',
  activityLevel: 'moderate',
  goal: 'maintain',
}
const man: ProfileInput = {
  weightKg: 80,
  heightCm: 180,
  age: 25,
  sex: 'male',
  activityLevel: 'active',
  goal: 'gain_muscle',
}

describe('Mifflin-St Jeor BMR', () => {
  it('matches hand-worked examples', () => {
    // 10·65 + 6.25·165 − 5·30 − 161
    expect(bmr(woman)).toBeCloseTo(1370.25, 6)
    // 10·80 + 6.25·180 − 5·25 + 5
    expect(bmr(man)).toBeCloseTo(1805, 6)
  })

  it('differs by exactly 166 kcal between the sexes, all else equal', () => {
    expect(bmr({ ...woman, sex: 'male' }) - bmr(woman)).toBeCloseTo(166, 6)
  })
})

describe('TDEE', () => {
  it('multiplies BMR by the activity factor', () => {
    expect(tdee(woman)).toBeCloseTo(1370.25 * 1.55, 6)
    for (const level of ACTIVITY_LEVELS) {
      expect(tdee({ ...woman, activityLevel: level })).toBeCloseTo(
        bmr(woman) * ACTIVITY_MULTIPLIERS[level],
        6,
      )
    }
  })

  it('rises with activity', () => {
    const values = ACTIVITY_LEVELS.map((level) => tdee({ ...woman, activityLevel: level }))
    expect([...values].sort((a, b) => a - b)).toEqual(values)
  })
})

describe('calorie target', () => {
  it('applies −20 % for fat loss and +10 % for muscle gain', () => {
    const maintenance = tdee(woman)
    expect(calorieTarget({ ...woman, goal: 'maintain' })).toBeCloseTo(maintenance, 6)
    expect(calorieTarget({ ...woman, goal: 'lose_fat' })).toBeCloseTo(maintenance * 0.8, 6)
    expect(calorieTarget({ ...woman, goal: 'gain_muscle' })).toBeCloseTo(maintenance * 1.1, 6)
  })

  it('never sets a fat-loss target below the floor', () => {
    const small: ProfileInput = {
      ...woman,
      weightKg: 50,
      heightCm: 155,
      activityLevel: 'sedentary',
      goal: 'lose_fat',
    }
    expect(tdee(small) * 0.8).toBeLessThan(1200)
    expect(calorieTarget(small)).toBe(1200)
    const smallMan: ProfileInput = { ...small, sex: 'male', weightKg: 55 }
    expect(calorieTarget(smallMan)).toBe(1500)
  })

  it('uses TDEE itself when TDEE is already under the floor', () => {
    const tiny: ProfileInput = {
      weightKg: 45,
      heightCm: 150,
      age: 60,
      sex: 'female',
      activityLevel: 'sedentary',
      goal: 'lose_fat',
    }
    expect(tdee(tiny)).toBeLessThan(1200)
    expect(calorieTarget(tiny)).toBeCloseTo(tdee(tiny), 6)
  })
})

describe('calculateTargets', () => {
  it('gives the hand-worked targets for a moderately active woman maintaining weight', () => {
    expect(calculateTargets(woman)).toEqual({
      formulaVersion: FORMULA_VERSION,
      bmrKcal: 1370,
      tdeeKcal: 2120,
      calorieTargetKcal: 2120,
      proteinG: 104, // 1.6 g × 65 kg
      fatG: 71, // 30 % of 2120 kcal ÷ 9
      carbsG: 267, // (2120 − 104·4 − 70.67·9) ÷ 4
    })
  })

  it('gives the hand-worked targets for an active man building muscle', () => {
    expect(calculateTargets(man)).toEqual({
      formulaVersion: FORMULA_VERSION,
      bmrKcal: 1805,
      tdeeKcal: 3110,
      calorieTargetKcal: 3420,
      proteinG: 160, // 2.0 g × 80 kg
      fatG: 95, // 25 % of 3420 ÷ 9
      carbsG: 481,
    })
  })

  it('caps protein at 40 % of calories for heavy bodies', () => {
    const heavy: ProfileInput = {
      weightKg: 300,
      heightCm: 180,
      age: 40,
      sex: 'male',
      activityLevel: 'sedentary',
      goal: 'lose_fat',
    }
    const targets = calculateTargets(heavy)
    expect(targets.proteinG).toBe(Math.round((0.4 * targets.calorieTargetKcal) / 4))
    expect(targets.proteinG).toBeLessThan(2.2 * 300)
  })

  it('adds up: the macros make the calorie target (within rounding)', () => {
    for (const sex of SEXES)
      for (const goal of GOALS)
        for (const activityLevel of ACTIVITY_LEVELS) {
          const t = calculateTargets({ ...woman, sex, goal, activityLevel })
          const kcal =
            t.proteinG * KCAL_PER_GRAM.protein +
            t.fatG * KCAL_PER_GRAM.fat +
            t.carbsG * KCAL_PER_GRAM.carbs
          expect(Math.abs(kcal - t.calorieTargetKcal)).toBeLessThan(15)
          expect(t.calorieTargetKcal % 10).toBe(0)
          expect(t.carbsG).toBeGreaterThanOrEqual(0)
        }
  })

  it('rejects inputs outside the supported ranges', () => {
    expect(() => calculateTargets({ ...woman, age: 17 })).toThrow(/age must be between 18 and 80/)
    expect(() => calculateTargets({ ...woman, age: 81 })).toThrow(RangeError)
    expect(() => calculateTargets({ ...woman, weightKg: 29 })).toThrow(/weightKg/)
    expect(() => calculateTargets({ ...woman, heightCm: 231 })).toThrow(/heightCm/)
    expect(() => calculateTargets({ ...woman, weightKg: Number.NaN })).toThrow(/weightKg/)
    expect(() =>
      assertValidProfile({ ...woman, weightKg: 30, heightCm: 230, age: 80 }),
    ).not.toThrow()
  })
})

describe('ageFromBirthYear', () => {
  it('is the age reached this calendar year', () => {
    expect(ageFromBirthYear(1996, new Date('2026-01-01T00:00:00Z'))).toBe(30)
    expect(ageFromBirthYear(1996, new Date('2026-12-31T23:00:00Z'))).toBe(30)
  })
})
