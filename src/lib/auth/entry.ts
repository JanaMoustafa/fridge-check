/**
 * Who may enter the app. With accounts switched on, everything except the intro page, the legal
 * and pricing pages and the sign-in and payment callbacks needs a session; signed-out visitors
 * are sent to the intro page (pages) or told to sign in (APIs). Without accounts (CI, e2e
 * without a database) the app is open, as it always was.
 *
 * This runs in the proxy on every request, so it only checks that a session cookie is present;
 * the pages check the session itself.
 */

/** Better Auth's session cookie, with the __Secure- prefix it uses over HTTPS. */
export const SESSION_COOKIES = ['better-auth.session_token', '__Secure-better-auth.session_token']

export const WELCOME_PATH = '/welcome'

const PUBLIC_PAGES = new Set([WELCOME_PATH, '/privacy', '/terms', '/refunds', '/pro'])
// /ocr/: the on-device reader's engine and model, plain files a worker fetches.
const PUBLIC_PREFIXES = ['/api/auth/', '/api/webhooks/', '/_next/', '/ocr/']
const PUBLIC_FILES = /^\/(?:icon\.svg|manifest\.webmanifest|robots\.txt|sitemap\.xml|favicon\.ico)$/

/** Whether accounts are switched on: the same settings sign-in itself needs. */
export function signInRequired(env: Readonly<Record<string, string | undefined>>): boolean {
  return [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ].every((name) => Boolean(env[name]?.trim()))
}

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PAGES.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PUBLIC_FILES.test(pathname)
  )
}

export type EntryDecision =
  { kind: 'allow' } | { kind: 'welcome'; location: string } | { kind: 'unauthorized' }

export function entryDecision(input: {
  pathname: string
  search: string
  hasSession: boolean
  required: boolean
}): EntryDecision {
  if (!input.required || input.hasSession || isPublicPath(input.pathname)) return { kind: 'allow' }
  if (input.pathname.startsWith('/api/')) return { kind: 'unauthorized' }
  const back = `${input.pathname}${input.search}`
  return {
    kind: 'welcome',
    location: back === '/' ? WELCOME_PATH : `${WELCOME_PATH}?next=${encodeURIComponent(back)}`,
  }
}
