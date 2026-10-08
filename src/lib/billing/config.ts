import 'server-only'
import { proConfig, serverEnv } from '@/lib/server/env'
import { createXPayClient, type XPayClient } from './xpay'

let client: XPayClient | undefined

/** The XPay client, or null when payments are not configured (Pro sign-in may still work). */
export function getXPay(): XPayClient | null {
  const env = serverEnv()
  if (!proConfig(env) || !env.XPAY_SECRET_KEY) return null
  client ??= createXPayClient({ secretKey: env.XPAY_SECRET_KEY })
  return client
}

export function webhookSecret(): string | null {
  return serverEnv().XPAY_WEBHOOK_SECRET ?? null
}

/** The public origin XPay redirects back to (the same origin Google signs in on). */
export function siteUrl(): string | null {
  return proConfig(serverEnv())?.authUrl ?? null
}
