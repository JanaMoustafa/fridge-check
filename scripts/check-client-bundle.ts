/**
 * Fails if a server-only secret leaks into the browser bundle (.next/static).
 * Checks secret *names* always, and secret *values* when they are set (CI builds with canary values).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const SECRET_NAMES = ['SPOONACULAR_API_KEY', 'THEMEALDB_API_KEY'] as const

export function findLeaks(contents: string, needles: readonly string[]): string[] {
  return needles.filter((needle) => contents.includes(needle))
}

export function secretNeedles(env: Record<string, string | undefined>): string[] {
  const values = SECRET_NAMES.map((name) => env[name]?.trim()).filter(
    // Short values (e.g. TheMealDB's public test key "1") would match any bundle by accident.
    (value): value is string => Boolean(value && value.length >= 8),
  )
  return [...SECRET_NAMES, ...values]
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

if (process.argv[1]?.endsWith('check-client-bundle.ts')) {
  const staticDir = join(process.cwd(), '.next', 'static')
  if (!existsSync(staticDir)) {
    console.error('No .next/static directory: run `pnpm build` first.')
    process.exitCode = 1
  } else {
    const needles = secretNeedles(process.env)
    const leaks = walk(staticDir).flatMap((file) =>
      findLeaks(readFileSync(file, 'utf8'), needles).map((needle) => ({ file, needle })),
    )
    if (leaks.length === 0) {
      console.log(`✓ No secrets in the client bundle (${needles.length} needles checked).`)
    } else {
      for (const leak of leaks) {
        const shown = (SECRET_NAMES as readonly string[]).includes(leak.needle)
          ? leak.needle
          : '<secret value>'
        console.error(`✗ ${shown} found in ${leak.file}`)
      }
      process.exitCode = 1
    }
  }
}
