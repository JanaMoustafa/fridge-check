import { describe, expect, it } from 'vitest'
import {
  bmiOf,
  changeBetween,
  dailyFibreG,
  dailyWaterL,
  levelOf,
  NORMAL_BAND,
  planMonthDate,
  projectSixMonths,
  standardsFor,
} from './report'

describe('daily water and fibre', () => {
  it('35 ml per kg, to one decimal; 14 g of fibre per 1,000 kcal', () => {
    expect(dailyWaterL(68)).toBe(2.4)
    expect(dailyWaterL(80)).toBe(2.8)
    expect(dailyFibreG(1690)).toBe(24)
    expect(dailyFibreG(2500)).toBe(35)
  })
})

describe('body composition bars', () => {
  it('sets the typical values for a height and sex', () => {
    const woman = standardsFor(165, 'female')
    expect(woman.weightKg).toBeCloseTo(59.9, 1)
    expect((22.6 / woman.bfmKg) * 100).toBeCloseTo(164, 0)
    const man = standardsFor(180, 'male')
    expect(man.smmKg).toBeCloseTo(33.5, 1)
  })

  it('reads a value against its normal band', () => {
    expect(levelOf(113, NORMAL_BAND.weight)).toBe('normal')
    expect(levelOf(164, NORMAL_BAND.bfm)).toBe('over')
    expect(levelOf(85, NORMAL_BAND.smm)).toBe('under')
    expect(bmiOf(68, 165)).toBeCloseTo(25, 1)
  })
})

describe('projectSixMonths', () => {
  it('loses about 9 kg over 6 months for the sample woman, mostly fat', () => {
    const points = projectSixMonths({
      weightKg: 68,
      fatKg: 22.6,
      muscleKg: 24.1,
      goal: 'lose_fat',
      sex: 'female',
    })
    expect(points).toHaveLength(7)
    expect(points[0]).toMatchObject({ month: 0, weightKg: 68, lowKg: 68, highKg: 68 })
    expect(points[1]!.weightKg).toBeCloseTo(66.0, 1)
    expect(points[6]!.weightKg).toBeCloseTo(59.0, 0)
    expect(points[6]!.pbf!).toBeLessThan(27)
    expect(points[6]!.muscleKg!).toBeGreaterThan(24.1)
    expect(points[6]!.lowKg).toBeLessThan(points[6]!.weightKg)
    expect(points[6]!.highKg).toBeGreaterThan(points[6]!.weightKg)
  })

  it('stops losing once body fat nears the healthy floor', () => {
    const points = projectSixMonths({
      weightKg: 60,
      fatKg: 12.5,
      muscleKg: 27,
      goal: 'lose_fat',
      sex: 'female',
    })
    // 20.8 % is within 4 points of 18 %: the weight holds steady (recomposition).
    expect(points[6]!.weightKg).toBeCloseTo(59.4, 1)
  })

  it('gains slowly when building muscle, and holds weight when maintaining', () => {
    const gain = projectSixMonths({
      weightKg: 70,
      fatKg: 12,
      muscleKg: 33,
      goal: 'gain_muscle',
      sex: 'male',
    })
    expect(gain[6]!.weightKg).toBeCloseTo(72.1, 1)
    expect(gain[6]!.muscleKg!).toBeCloseTo(34.5, 1)
    const hold = projectSixMonths({
      weightKg: 70,
      fatKg: null,
      muscleKg: null,
      goal: 'maintain',
      sex: 'male',
    })
    expect(hold[6]!.weightKg).toBeCloseTo(69.4, 1)
    expect(hold[6]!.pbf).toBeNull()
  })
})

describe('changeBetween', () => {
  it('compares two scans, working out fat from what each scan has', () => {
    const change = changeBetween(
      { weightKg: 68, smmKg: 24.1, bfmKg: 22.6, pbf: null },
      { weightKg: 66, smmKg: null, bfmKg: null, pbf: 31 },
    )
    expect(change.weightKg).toBe(-2)
    expect(change.smmKg).toBeNull()
    expect(change.fatKg).toBeCloseTo(20.46 - 22.6, 2)
    expect(change.pbf).toBeCloseTo(31 - (22.6 / 68) * 100, 2)
    expect(
      changeBetween(
        { weightKg: 70, smmKg: 30, bfmKg: null, pbf: null },
        { weightKg: 70, smmKg: 31, bfmKg: 12, pbf: null },
      ),
    ).toEqual({ weightKg: 0, smmKg: 1, fatKg: null, pbf: null })
  })
})

describe('planMonthDate', () => {
  it('steps 30 days a month', () => {
    expect(planMonthDate('2026-10-27', 0)).toBe('2026-10-27')
    expect(planMonthDate('2026-10-27', 1)).toBe('2026-11-26')
    expect(planMonthDate('2026-10-27', 6)).toBe('2027-04-25')
  })
})
