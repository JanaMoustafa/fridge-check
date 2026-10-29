'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSignedInUser } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { getDb } from '@/lib/db/client'
import {
  parseScanForm,
  SCAN_FIELDS,
  type ScanError,
  type ScanField,
} from '@/lib/nutritionist/inbody'
import { parseExtraJson } from '@/lib/nutritionist/inbody-extra'
import { MEALS, type Meal } from '@/lib/nutrition/portions'
import { cairoDate } from '@/lib/nutritionist/inbody'
import { deleteScan, saveScan } from '@/lib/server/inbody'
import { clearMealChoice, saveMealChoice } from '@/lib/server/meal-choices'
import { mealOptionsFor } from '@/lib/server/meal-plan'
import { getProfile } from '@/lib/server/profiles'

export interface ScanFormState {
  errors?: Partial<Record<ScanField | 'scannedOn', ScanError>>
  /** What the member typed, so a rejected form keeps their numbers. */
  values?: Record<string, string>
  failed?: boolean
}

/**
 * Saves the numbers the member checked (read from their photo or typed in) as a new scan for the
 * signed-in member (the session decides whose), then shows the updated plan.
 */
export async function saveScanAction(
  _previous: ScanFormState,
  formData: FormData,
): Promise<ScanFormState> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome?next=%2Fnutritionist%2Fscan')
  const now = new Date()
  if (!(await getProAccess(getDb(), user.id, now)).isPro) redirect('/pro')

  const form: Record<string, string> = {}
  for (const name of [...SCAN_FIELDS, 'scannedOn', 'source', 'extra']) {
    const value = formData.get(name)
    if (typeof value === 'string') form[name] = value
  }
  const parsed = parseScanForm(form, now)
  if (!parsed.ok) return { errors: parsed.errors, values: form }
  try {
    await saveScan(
      getDb(),
      user.id,
      parsed.values,
      form.source === 'photo' ? 'photo' : 'typed',
      now,
      parseExtraJson(form.extra),
    )
  } catch (error) {
    console.error('[inbody] save failed', error instanceof Error ? error.message : error)
    return { failed: true, values: form }
  }
  redirect('/nutritionist?saved=scan')
}

/** Deletes one of the signed-in member's own scans. */
export async function deleteScanAction(formData: FormData): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome?next=%2Fnutritionist%2Freport')
  const id = formData.get('id')
  if (typeof id === 'string') await deleteScan(getDb(), user.id, id)
  redirect('/nutritionist/report?deleted=1')
}

/**
 * Picks one of today's options for a meal ("suggested" goes back to the day's suggestion). Only
 * an option the meal really offers is saved, and only for today.
 */
export async function chooseMealAction(formData: FormData): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome?next=%2Fnutritionist')
  const now = new Date()
  const meal = formData.get('meal')
  const optionId = formData.get('optionId')
  if (
    typeof meal !== 'string' ||
    !(MEALS as readonly string[]).includes(meal) ||
    typeof optionId !== 'string'
  ) {
    redirect('/nutritionist')
  }
  const today = cairoDate(now)
  // No redirect: the page refreshes in place, so the member stays at the meal they changed.
  if (optionId === 'suggested') {
    await clearMealChoice(getDb(), user.id, today, meal as Meal)
    revalidatePath('/nutritionist')
    return
  }
  const profile = await getProfile(getDb(), user.id, now)
  if (!profile) redirect('/profile?next=%2Fnutritionist')
  const options = await mealOptionsFor(
    user.id,
    today,
    profile.targets,
    profile.values.mealSplit,
    meal as Meal,
  )
  if (options.some((option) => option.optionId === optionId)) {
    await saveMealChoice(getDb(), user.id, today, meal as Meal, optionId, now)
  }
  revalidatePath('/nutritionist')
}
