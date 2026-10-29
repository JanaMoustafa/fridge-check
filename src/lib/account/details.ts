/** The member's own details on the account page: full name (required) and phone (optional). */

export interface MemberDetails {
  name: string
  /** Digits with an optional leading +, 7–15 digits; null when not given. */
  phone: string | null
}

/** What can be wrong with each field (the message keys follow these names). */
export interface DetailsErrors {
  name?: 'required' | 'tooLong'
  phone?: 'invalid'
}

export type ParsedDetails =
  { ok: true; values: MemberDetails } | { ok: false; errors: DetailsErrors }

export const NAME_MAX = 80

const ARABIC_DIGITS = /[٠-٩۰-۹]/g
const toLatinDigits = (text: string) =>
  text.replace(ARABIC_DIGITS, (d) =>
    String('٠١٢٣٤٥٦٧٨٩'.indexOf(d) >= 0 ? '٠١٢٣٤٥٦٧٨٩'.indexOf(d) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),
  )

/** Keeps a leading + and the digits; spaces, dashes, dots and brackets people type are dropped. */
export function normalizePhone(raw: string): string | null {
  const text = toLatinDigits(raw.trim())
  if (text === '') return null
  if (!/^[+0-9\s().-]+$/.test(text)) return 'invalid'
  const digits = text.replace(/[^0-9]/g, '')
  const plus = text.startsWith('+') ? '+' : ''
  return /^[0-9]{7,15}$/.test(digits) ? plus + digits : 'invalid'
}

export function parseDetailsForm(form: Record<string, string | undefined>): ParsedDetails {
  const errors: DetailsErrors = {}
  const name = (form.name ?? '').trim().replace(/\s+/g, ' ')
  if (name === '') errors.name = 'required'
  else if (name.length > NAME_MAX) errors.name = 'tooLong'
  const phone = normalizePhone(form.phone ?? '')
  if (phone === 'invalid') errors.phone = 'invalid'
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, values: { name, phone } }
}
