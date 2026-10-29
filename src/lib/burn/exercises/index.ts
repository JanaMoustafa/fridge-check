import type { Exercise } from '../types'
import { CALISTHENICS } from './calisthenics'
import { CROSSFIT } from './crossfit'
import { GYM } from './gym'
import { PILATES } from './pilates'

/**
 * The whole BurnToReturn library: one file per style. Each style covers every body area with
 * enough exercises for the weekly rotation (see ../programme.ts and the library test).
 */
export const EXERCISES: readonly Exercise[] = [...CALISTHENICS, ...PILATES, ...GYM, ...CROSSFIT]
