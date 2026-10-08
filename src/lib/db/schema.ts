import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

/**
 * The database, table by table, for Kysely's typed queries. The four sign-in tables belong to
 * Better Auth and keep its camelCase column names; our own tables use snake_case. Changes go
 * through a new migration in ./migrations (never by editing an applied one).
 */

/** A timestamp the database fills in: optional on insert, always present when read. */
type CreatedAt = ColumnType<Date, Date | string | undefined, never>
type UpdatedAt = ColumnType<Date, Date | string | undefined, Date | string>
type Timestamp = ColumnType<Date, Date | string, Date | string>

// --- Better Auth (core schema of better-auth 1.7) -------------------------------------------

export interface UserTable {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SessionTable {
  id: string
  expiresAt: Timestamp
  token: string
  createdAt: Timestamp
  updatedAt: Timestamp
  ipAddress: string | null
  userAgent: string | null
  userId: string
}

export interface AccountTable {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: Timestamp | null
  refreshTokenExpiresAt: Timestamp | null
  scope: string | null
  password: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface VerificationTable {
  id: string
  identifier: string
  value: string
  expiresAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// --- Nutrition profile ------------------------------------------------------------------------

export const SEXES = ['female', 'male'] as const
export type Sex = (typeof SEXES)[number]

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export const GOALS = ['lose_fat', 'maintain', 'gain_muscle'] as const
export type Goal = (typeof GOALS)[number]

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const
export type Meal = (typeof MEALS)[number]
/** Percent of the day's calories per meal; the four add up to 100. */
export type MealSplit = Record<Meal, number>

export interface NutritionProfileTable {
  user_id: string
  weight_kg: number
  height_cm: number
  /** Birth year rather than age, so the targets stay right as years pass. */
  birth_year: number
  sex: Sex
  activity_level: ActivityLevel
  goal: Goal
  meal_split: ColumnType<MealSplit, MealSplit | undefined, MealSplit>
  /** When the user agreed to us storing these health details. */
  consented_at: Timestamp
  /** Results of src/lib/nutrition/calculator.ts, stored so pages need no recalculation. */
  formula_version: number
  bmr_kcal: number
  tdee_kcal: number
  calorie_target_kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  created_at: CreatedAt
  updated_at: UpdatedAt
}

// --- Billing --------------------------------------------------------------------------------

export const SUBSCRIPTION_STATUSES = ['active', 'past_due', 'canceled', 'expired'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const PLANS = ['pro_monthly'] as const
export type Plan = (typeof PLANS)[number]

/** One row per user: their Pro access, extended by each paid period. */
export interface SubscriptionTable {
  id: Generated<string>
  user_id: string
  plan: Plan
  status: SubscriptionStatus
  /** Canceled: Pro stays until current_period_end, then the row expires. */
  cancel_at_period_end: Generated<boolean>
  xpay_customer_id: string | null
  /** For XPay subscriptions once XPay enables them; prepaid passes leave it null. */
  xpay_subscription_id: string | null
  /** The checkout session that paid for the current period. */
  xpay_checkout_session_id: string | null
  current_period_start: Timestamp
  current_period_end: Timestamp
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/**
 * One row per XPay checkout: created as pending when the user starts checkout, settled by the
 * webhook. The unique session id is what makes a repeated webhook unable to pay twice. Kept
 * (user_id set to null) when an account is deleted: payments are financial records.
 */
export interface PaymentTable {
  id: Generated<string>
  user_id: string | null
  plan: Plan
  status: PaymentStatus
  xpay_checkout_session_id: string
  xpay_payment_intent_id: string | null
  xpay_customer_id: string | null
  /** In the currency's minor unit (piasters for EGP). */
  amount_minor: number
  currency: string
  period_start: Timestamp | null
  period_end: Timestamp | null
  created_at: CreatedAt
  updated_at: UpdatedAt
}

/** Every verified webhook XPay sent, as received: the audit log and the idempotency key. */
export interface WebhookEventTable {
  id: string
  type: string
  livemode: boolean
  payload: ColumnType<unknown, unknown, unknown>
  received_at: CreatedAt
  processed_at: Timestamp | null
  error: string | null
}

export interface Database {
  user: UserTable
  session: SessionTable
  account: AccountTable
  verification: VerificationTable
  nutrition_profile: NutritionProfileTable
  subscription: SubscriptionTable
  payment: PaymentTable
  webhook_event: WebhookEventTable
}

export type NutritionProfileRow = Selectable<NutritionProfileTable>
export type NewNutritionProfile = Insertable<NutritionProfileTable>
export type SubscriptionRow = Selectable<SubscriptionTable>
export type SubscriptionUpdate = Updateable<SubscriptionTable>
export type PaymentRow = Selectable<PaymentTable>
