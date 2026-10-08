/**
 * The Pro plan: a prepaid 30-day pass (XPay Egypt cannot renew automatically yet, see
 * docs/PLAN.md). Prices are in EGP; XPay takes amounts in piasters.
 */
export const PRO_PLAN = 'pro_monthly' as const
export const PRO_PRICE_EGP = 200
export const PRO_PRICE_MINOR = PRO_PRICE_EGP * 100
export const PRO_CURRENCY = 'EGP' as const
export const PRO_PERIOD_DAYS = 30
