import 'server-only'
import { z } from 'zod'

const ServerEnvSchema = z.object({
  /** Which provider answers searches: the built-in collection (default) or a live API. */
  RECIPE_PROVIDER: z.enum(['local', 'mealdb', 'spoonacular']).default('local'),
  /** Spoonacular key: read only here, on the server; never sent to the browser. */
  SPOONACULAR_API_KEY: z.string().trim().min(1).optional(),
  /** TheMealDB key: "1" is the free development/educational key. */
  THEMEALDB_API_KEY: z.string().trim().min(1).default('1'),
  /** Per-IP requests per minute on the API routes ("0" turns limiting off, e.g. for e2e tests). */
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(0).default(60),
})
export type ServerEnv = z.infer<typeof ServerEnvSchema>

/**
 * Validated server configuration. A Spoonacular provider without a key is a configuration
 * error, reported clearly instead of failing on the first request.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const env = ServerEnvSchema.parse({
    RECIPE_PROVIDER: source.RECIPE_PROVIDER || undefined,
    SPOONACULAR_API_KEY: source.SPOONACULAR_API_KEY || undefined,
    THEMEALDB_API_KEY: source.THEMEALDB_API_KEY || undefined,
    RATE_LIMIT_PER_MINUTE: source.RATE_LIMIT_PER_MINUTE || undefined,
  })
  if (env.RECIPE_PROVIDER === 'spoonacular' && !env.SPOONACULAR_API_KEY) {
    throw new Error('RECIPE_PROVIDER=spoonacular needs SPOONACULAR_API_KEY (see .env.example).')
  }
  return env
}

let cached: ServerEnv | undefined
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}
