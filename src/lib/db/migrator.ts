import type { Kysely } from 'kysely'
import { Migrator, type Migration, type MigrationResultSet } from 'kysely/migration'
import * as auth from './migrations/0001_auth'
import * as nutritionProfile from './migrations/0002_nutrition_profile'
import * as billing from './migrations/0003_billing'

/**
 * Every migration, in order. Listed here rather than read from disk, so the same list works in
 * scripts, tests and bundled server code. Never edit or reorder an applied migration: add one.
 */
export const MIGRATIONS: Readonly<Record<string, Migration>> = {
  '0001_auth': auth,
  '0002_nutrition_profile': nutritionProfile,
  '0003_billing': billing,
}

export function createMigrator(db: Kysely<unknown>): Migrator {
  return new Migrator({ db, provider: { getMigrations: async () => ({ ...MIGRATIONS }) } })
}

/** Throws with the failing migration's name, so a half-applied run is never silent. */
export function assertMigrated({ error, results }: MigrationResultSet): void {
  if (error === undefined) return
  const failed = results?.find((result) => result.status === 'Error')
  const reason = error instanceof Error ? error.message : String(error)
  throw new Error(`Migration ${failed?.migrationName ?? '(setup)'} failed: ${reason}`)
}
