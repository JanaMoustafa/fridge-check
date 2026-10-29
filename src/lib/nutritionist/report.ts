import type { Goal, Sex } from '@/lib/nutrition/calculator'

/**
 * Your Nutritionist's numbers beyond calories and macros: water, fibre, the healthy ranges on
 * the body composition bars, and the expected path over six months. All in one tested place.
 */

/** Water: 35 ml per kg of body weight a day, plus half a litre on training days. */
export const WATER_ML_PER_KG = 35
export const TRAINING_DAY_EXTRA_L = 0.5
/** Fibre: 14 g for every 1,000 kcal eaten. */
export const FIBRE_G_PER_1000_KCAL = 14

export function dailyWaterL(weightKg: number): number {
  return Math.round((weightKg * WATER_ML_PER_KG) / 100) / 10
}

export function dailyFibreG(kcal: number): number {
  return Math.round((kcal * FIBRE_G_PER_1000_KCAL) / 1000)
}

/** Healthy body fat % by sex (the ranges InBody sheets commonly print). */
export const HEALTHY_PBF: Readonly<Record<Sex, readonly [number, number]>> = {
  female: [18, 28],
  male: [10, 20],
}

/** Healthy BMI range. */
export const HEALTHY_BMI = [18.5, 24.9] as const
/** Visceral fat level: under 10 is the healthy range. */
export const HEALTHY_VFL_BELOW = 10

/**
 * Typical values for a height and sex, the 100 % mark of each bar: weight at BMI 22, and the
 * muscle and fat mass of that weight for an average adult.
 */
export function standardsFor(heightCm: number, sex: Sex) {
  const weightKg = 22 * (heightCm / 100) ** 2
  return {
    weightKg,
    smmKg: weightKg * (sex === 'female' ? 0.4 : 0.47),
    bfmKg: weightKg * (sex === 'female' ? 0.23 : 0.15),
  }
}

/** The "normal" band of each bar, as % of the typical value (InBody's usual bands). */
export const NORMAL_BAND = {
  weight: [85, 115],
  smm: [90, 110],
  bfm: [80, 160],
} as const

export type Level = 'under' | 'normal' | 'over'

export function levelOf(value: number, [low, high]: readonly [number, number]): Level {
  return value < low ? 'under' : value > high ? 'over' : 'normal'
}

export function bmiOf(weightKg: number, heightCm: number): number {
  return weightKg / (heightCm / 100) ** 2
}

export interface ProjectionInput {
  weightKg: number
  fatKg: number | null
  muscleKg: number | null
  goal: Goal
  sex: Sex
}

export interface ProjectionPoint {
  month: number
  weightKg: number
  /** The likely range around weightKg. */
  lowKg: number
  highKg: number
  fatKg: number | null
  muscleKg: number | null
  pbf: number | null
}

/**
 * Losing fat: about 3 % of body weight in the first month, tapering to under 2 % by month six
 * (0.5–0.7 % a week, the pace usually advised), 90 % of it fat while training keeps muscle.
 * Stops once body fat is within 4 points of the bottom of the healthy range.
 */
const LOSS_RATE_BY_MONTH = [0.029, 0.027, 0.025, 0.022, 0.02, 0.017] as const
/** Gaining muscle: +0.5 % of body weight a month, 0.25 kg of it muscle. */
const GAIN_RATE = 0.005
const MUSCLE_GAIN_KG = 0.25
/** Maintaining: weight steady, about 0.2 kg of fat turning into 0.1 kg more muscle a month. */
const RECOMP_FAT_KG = -0.2
const RECOMP_MUSCLE_KG = 0.1
/** The likely range: ±35 % of the change so far. */
const RANGE_SHARE = 0.35

export function projectSixMonths(input: ProjectionInput): ProjectionPoint[] {
  const floorPbf = HEALTHY_PBF[input.sex][0] + 4
  let weight = input.weightKg
  let fat = input.fatKg
  let muscle = input.muscleKg
  const points: ProjectionPoint[] = [point(0)]
  for (let month = 1; month <= 6; month++) {
    let dWeight: number
    let dFat: number
    let dMuscle: number
    const pbf = fat === null ? null : (fat / weight) * 100
    if (input.goal === 'lose_fat' && (pbf === null || pbf > floorPbf)) {
      dWeight = -weight * LOSS_RATE_BY_MONTH[month - 1]!
      dFat = dWeight * 0.9
      dMuscle = 0.05
    } else if (input.goal === 'gain_muscle') {
      dWeight = weight * GAIN_RATE
      dMuscle = MUSCLE_GAIN_KG
      dFat = dWeight - dMuscle
    } else {
      dFat = RECOMP_FAT_KG
      dMuscle = RECOMP_MUSCLE_KG
      dWeight = dFat + dMuscle
    }
    weight += dWeight
    if (fat !== null) fat = Math.max(1, fat + dFat)
    if (muscle !== null) muscle += dMuscle
    points.push(point(month))
  }
  return points

  function point(month: number): ProjectionPoint {
    const spread = Math.abs(weight - input.weightKg) * RANGE_SHARE
    return {
      month,
      weightKg: weight,
      lowKg: weight - spread,
      highKg: weight + spread,
      fatKg: fat,
      muscleKg: muscle,
      pbf: fat === null ? null : (fat / weight) * 100,
    }
  }
}

export interface BodyNumbers {
  weightKg: number
  smmKg: number | null
  bfmKg: number | null
  pbf: number | null
}

export interface BodyChange {
  weightKg: number
  smmKg: number | null
  fatKg: number | null
  pbf: number | null
}

/** What changed from one scan to the next; null where either scan lacks the number. */
export function changeBetween(previous: BodyNumbers, current: BodyNumbers): BodyChange {
  const diff = (a: number | null, b: number | null) => (a === null || b === null ? null : b - a)
  const fat = (scan: BodyNumbers) =>
    scan.bfmKg ?? (scan.pbf === null ? null : (scan.weightKg * scan.pbf) / 100)
  const pbf = (scan: BodyNumbers) =>
    scan.pbf ?? (scan.bfmKg === null ? null : (scan.bfmKg / scan.weightKg) * 100)
  return {
    weightKg: current.weightKg - previous.weightKg,
    smmKg: diff(previous.smmKg, current.smmKg),
    fatKg: diff(fat(previous), fat(current)),
    pbf: diff(pbf(previous), pbf(current)),
  }
}

/** The date (YYYY-MM-DD) of month `n` of the plan: scans are monthly, 30 days apart. */
export function planMonthDate(start: string, month: number): string {
  const time = Date.parse(`${start}T12:00:00Z`) + month * 30 * 24 * 60 * 60 * 1000
  return new Date(time).toISOString().slice(0, 10)
}
