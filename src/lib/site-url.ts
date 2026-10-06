const LOCAL_URL = 'http://localhost:3000'

/**
 * Absolute site origin for metadata (Open Graph needs absolute URLs).
 * NEXT_PUBLIC_SITE_URL wins; Vercel's production hostname is the fallback.
 */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): URL {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    try {
      return new URL(explicit)
    } catch {
      // Fall through to the next candidate when the value is not a valid URL.
    }
  }
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelHost) return new URL(`https://${vercelHost}`)
  return new URL(LOCAL_URL)
}
