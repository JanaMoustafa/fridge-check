'use server'

import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { getSignedInUser } from '@/lib/auth/auth'
import { getXPay, siteUrl } from '@/lib/billing/config'
import { mayStartCheckout } from '@/lib/billing/subscription'
import { recordCheckoutStarted } from '@/lib/billing/webhook'
import { getDb } from '@/lib/db/client'

export interface CheckoutState {
  error?: 'unavailable' | 'failed' | 'tooMany'
}

/**
 * Starts an XPay hosted checkout for the signed-in user (the session decides who pays for whom)
 * and sends the browser to XPay's page. Our pending payment row is what the webhook settles.
 */
export async function startCheckoutAction(): Promise<CheckoutState> {
  const user = await getSignedInUser()
  if (!user) redirect(`/account?next=${encodeURIComponent('/pro')}`)
  const xpay = getXPay()
  const site = siteUrl()
  if (!xpay || !site) return { error: 'unavailable' }
  const db = getDb()
  const now = new Date()
  if (!(await mayStartCheckout(db, user.id, now))) return { error: 'tooMany' }

  let checkoutUrl: string
  try {
    const locale = (await getLocale()) === 'ar' ? 'ar' : 'en'
    const session = await xpay.createCheckoutSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      siteUrl: site,
      locale,
    })
    await recordCheckoutStarted(db, user.id, session.id, now)
    checkoutUrl = session.url
  } catch (error) {
    console.error('[checkout] could not start', error instanceof Error ? error.message : error)
    return { error: 'failed' }
  }
  redirect(checkoutUrl)
}
