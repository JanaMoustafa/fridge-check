'use server'

import { redirect } from 'next/navigation'
import { getSignedInUser } from '@/lib/auth/auth'
import { getDb } from '@/lib/db/client'
import { safeNext } from '@/lib/navigation/safe-next'
import { parseProfileForm, type ProfileError, type ProfileField } from '@/lib/nutrition/profile'
import { saveProfile } from '@/lib/server/profiles'

export interface ProfileFormState {
  errors?: Partial<Record<ProfileField, ProfileError>>
  /** What the user typed, so a rejected form keeps their answers. */
  values?: Record<string, string>
  failed?: boolean
}

/**
 * Saves the signed-in user's profile (the session decides whose; nothing in the form does),
 * recalculating their targets, then returns to `next` or the account page.
 */
export async function saveProfileAction(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getSignedInUser()
  if (!user) redirect('/account')

  const form = Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
  const parsed = parseProfileForm(form, new Date())
  if (!parsed.ok) return { errors: parsed.errors, values: form }
  try {
    await saveProfile(getDb(), user.id, parsed.values, new Date())
  } catch (error) {
    console.error('[profile] save failed', error instanceof Error ? error.message : error)
    return { failed: true, values: form }
  }
  redirect(safeNext(form.next) ?? '/account?saved=profile')
}
