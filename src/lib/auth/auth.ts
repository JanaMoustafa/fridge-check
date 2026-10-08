import 'server-only'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { headers } from 'next/headers'
import { cache } from 'react'
import { getDb } from '@/lib/db/client'
import { proConfig, serverEnv, type ProConfig } from '@/lib/server/env'

const DAY_S = 24 * 60 * 60

/**
 * Better Auth with Google as the only sign-in method, storing users and sessions in Postgres.
 * Sessions last 30 days and are re-validated against the database at most every 5 minutes
 * (cookie cache), so ordinary page views do not query the database.
 */
export function createAuth(config: ProConfig) {
  return betterAuth({
    appName: 'Fridge Check',
    baseURL: config.authUrl,
    secret: config.authSecret,
    database: { db: getDb(), type: 'postgres' },
    socialProviders: {
      google: {
        clientId: config.google.clientId,
        clientSecret: config.google.clientSecret,
        prompt: 'select_account',
      },
    },
    session: {
      expiresIn: 30 * DAY_S,
      updateAge: DAY_S,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    // Sets cookies from Server Actions (sign out, delete account).
    plugins: [nextCookies()],
  })
}
export type Auth = ReturnType<typeof createAuth>

let auth: Auth | undefined

/** The auth instance, or null when Pro is not configured (the free app has no accounts). */
export function getAuth(): Auth | null {
  if (auth) return auth
  const config = proConfig(serverEnv())
  if (!config) return null
  auth = createAuth(config)
  return auth
}

export function isProConfigured(): boolean {
  return proConfig(serverEnv()) !== null
}

export interface SignedInUser {
  id: string
  name: string
  email: string
  image: string | null
}

/**
 * The signed-in user for this request, or null (signed out, or Pro not configured). Cached per
 * request, so a layout and a page share one lookup.
 */
export const getSignedInUser = cache(async (): Promise<SignedInUser | null> => {
  const instance = getAuth()
  if (!instance) return null
  const session = await instance.api.getSession({ headers: await headers() })
  if (!session) return null
  const { id, name, email, image } = session.user
  return { id, name, email, image: image ?? null }
})
