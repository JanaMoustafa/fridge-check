import 'server-only'
import { z } from 'zod'

const Secret = z.string().trim().min(1)

const ServerEnvSchema = z.object({
  /** Which provider answers searches: the built-in collection (default) or a live API. */
  RECIPE_PROVIDER: z.enum(['local', 'mealdb', 'spoonacular']).default('local'),
  /** Spoonacular key: read only here, on the server; never sent to the browser. */
  SPOONACULAR_API_KEY: Secret.optional(),
  /** TheMealDB key: "1" is the free development/educational key. */
  THEMEALDB_API_KEY: Secret.default('1'),
  /** Per-IP requests per minute on the API routes ("0" turns limiting off, e.g. for e2e tests). */
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(0).default(60),

  // --- Pro: the first five are all needed for sign-in and the nutrition profile ----------------
  /** Postgres (Neon) connection string. */
  DATABASE_URL: Secret.optional(),
  /** Signs session cookies: at least 32 random characters (`openssl rand -base64 32`). */
  BETTER_AUTH_SECRET: z.string().trim().min(32).optional(),
  /** The site's public origin, e.g. https://fridge-check-sooty.vercel.app (Google returns here). */
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }).optional(),
  GOOGLE_CLIENT_ID: Secret.optional(),
  GOOGLE_CLIENT_SECRET: Secret.optional(),
  /** XPay Egypt secret key (sk_test_… / sk_live_…) and webhook signing secret (whsec_…). */
  XPAY_SECRET_KEY: Secret.optional(),
  XPAY_WEBHOOK_SECRET: Secret.optional(),
})
export type ServerEnv = z.infer<typeof ServerEnvSchema>

/**
 * Validated server configuration. Empty strings count as unset. A Spoonacular provider without a
 * key is a configuration error, reported clearly instead of failing on the first request.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const present = Object.fromEntries(
    Object.keys(ServerEnvSchema.shape).map((key) => [key, source[key] || undefined]),
  )
  const env = ServerEnvSchema.parse(present)
  if (env.RECIPE_PROVIDER === 'spoonacular' && !env.SPOONACULAR_API_KEY) {
    throw new Error('RECIPE_PROVIDER=spoonacular needs SPOONACULAR_API_KEY (see .env.example).')
  }
  return env
}

export interface ProConfig {
  databaseUrl: string
  authSecret: string
  authUrl: string
  google: { clientId: string; clientSecret: string }
}

/**
 * What sign-in and the nutrition profile need, or null when anything is missing: the app then
 * runs as the free, account-free version (as in CI and e2e) and hides every Pro entry point.
 */
export function proConfig(env: ServerEnv): ProConfig | null {
  const { DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL } = env
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env
  if (!DATABASE_URL || !BETTER_AUTH_SECRET || !BETTER_AUTH_URL) return null
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null
  return {
    databaseUrl: DATABASE_URL,
    authSecret: BETTER_AUTH_SECRET,
    authUrl: BETTER_AUTH_URL,
    google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET },
  }
}

let cached: ServerEnv | undefined
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}
