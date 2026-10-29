'use server'

import { redirect } from 'next/navigation'
import { getSignedInUser } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { parseTrainingForm, type TrainingFormErrors } from '@/lib/burn/programme'
import { getDb } from '@/lib/db/client'
import { saveTrainingChoice } from '@/lib/server/training'

export interface TrainingFormState {
  errors?: TrainingFormErrors
  /** What the member picked, so a rejected form keeps it. */
  values?: { style: string | null; days: number[] }
  failed?: boolean
}

/** Saves the signed-in member's training style and days (the session decides whose). */
export async function saveTrainingAction(
  _previous: TrainingFormState,
  formData: FormData,
): Promise<TrainingFormState> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome?next=%2Fburn%2Fsetup')
  const now = new Date()
  if (!(await getProAccess(getDb(), user.id, now)).isPro) redirect('/pro')

  const style = formData.get('style')
  const days = formData.getAll('day')
  const values = {
    style: typeof style === 'string' ? style : null,
    days: days.map(Number).filter(Number.isInteger),
  }
  const parsed = parseTrainingForm(style, days)
  if (!parsed.ok) return { errors: parsed.errors, values }
  try {
    await saveTrainingChoice(getDb(), user.id, parsed.value, now)
  } catch (error) {
    console.error('[burn] save failed', error instanceof Error ? error.message : error)
    return { failed: true, values }
  }
  redirect('/burn?saved=1')
}
