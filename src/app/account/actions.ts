'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuth, getSignedInUser } from '@/lib/auth/auth'
import { cancelRenewal, resumeRenewal } from '@/lib/billing/subscription'
import { getDb } from '@/lib/db/client'
import { deleteAccount } from '@/lib/server/profiles'

/** Ends the session and clears its cookie. */
export async function signOutAction(): Promise<void> {
  const auth = getAuth()
  if (auth) await auth.api.signOut({ headers: await headers() }).catch(() => undefined)
  redirect('/account')
}

/**
 * Deletes the signed-in user's account and data (the session decides whose), then signs out.
 * The sessions are already gone with the user; signing out clears this browser's cookie.
 */
export async function deleteAccountAction(): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/account')
  await deleteAccount(getDb(), user.id)
  const auth = getAuth()
  if (auth) await auth.api.signOut({ headers: await headers() }).catch(() => undefined)
  redirect('/account?deleted=1')
}

/** Turns renewal reminders off: Pro stays until the paid period ends (nothing auto-renews). */
export async function cancelRenewalAction(): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/account')
  await cancelRenewal(getDb(), user.id, new Date())
  redirect('/account')
}

export async function resumeRenewalAction(): Promise<void> {
  const user = await getSignedInUser()
  if (!user) redirect('/account')
  await resumeRenewal(getDb(), user.id, new Date())
  redirect('/account')
}
