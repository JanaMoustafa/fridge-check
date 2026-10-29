'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuth, getSignedInUser } from '@/lib/auth/auth'
import { cancelRenewal, resumeRenewal } from '@/lib/billing/subscription'
import { getDb } from '@/lib/db/client'
import { parseDetailsForm, type DetailsErrors } from '@/lib/account/details'
import { saveDetails } from '@/lib/server/details'
import { deleteAccount } from '@/lib/server/profiles'

/** Ends the session and clears its cookie. */
export async function signOutAction(): Promise<void> {
  const auth = getAuth()
  if (auth) await auth.api.signOut({ headers: await headers() }).catch(() => undefined)
  redirect('/welcome')
}

/**
 * Deletes the signed-in user's account and data (the session decides whose), then signs out.
 * The sessions are already gone with the user; signing out clears this browser's cookie.
 */
export async function deleteAccountAction(): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome')
  await deleteAccount(getDb(), user.id)
  const auth = getAuth()
  if (auth) await auth.api.signOut({ headers: await headers() }).catch(() => undefined)
  redirect('/welcome?deleted=1')
}

/** Turns renewal reminders off: Pro stays until the paid period ends (nothing auto-renews). */
export async function cancelRenewalAction(): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome')
  await cancelRenewal(getDb(), user.id, new Date())
  redirect('/account')
}

export async function resumeRenewalAction(): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome')
  await resumeRenewal(getDb(), user.id, new Date())
  redirect('/account')
}

export interface DetailsFormState {
  errors?: DetailsErrors
  values?: Record<string, string>
  failed?: boolean
}

/** Saves the signed-in member's name and phone (the session decides whose). */
export async function saveDetailsAction(
  _previous: DetailsFormState,
  formData: FormData,
): Promise<DetailsFormState> {
  const user = await getSignedInUser()
  if (!user) redirect('/welcome')
  const form = {
    name: String(formData.get('name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
  }
  const parsed = parseDetailsForm(form)
  if (!parsed.ok) return { errors: parsed.errors, values: form }
  try {
    await saveDetails(getDb(), user.id, parsed.values, new Date())
  } catch (error) {
    console.error('[details] save failed', error instanceof Error ? error.message : error)
    return { failed: true, values: form }
  }
  redirect('/account?saved=details')
}
