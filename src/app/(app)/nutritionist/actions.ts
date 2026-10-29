'use server'

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
import { deleteScan, saveScan } from '@/lib/server/inbody'

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
