/**
 * Applies or reverts database migrations against DATABASE_URL (from .env.local locally).
 *   pnpm db:migrate            apply every pending migration
 *   pnpm db:migrate down       revert the most recent migration
 *   pnpm db:migrate status     list migrations and whether each is applied
 *   pnpm db:migrate:prod [...]  the same against the live database (PRODUCTION_DATABASE_URL)
 */
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { withStrictSsl } from '@/lib/db/connection'
import { databaseUrl, withoutFlags } from './database-url'
import { assertMigrated, createMigrator } from '@/lib/db/migrator'

async function main(args: string[]) {
  const connectionString = databaseUrl(args)
  const command = withoutFlags(args)[0] ?? 'up'
  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: withStrictSsl(connectionString), max: 1 }),
    }),
  })
  try {
    const migrator = createMigrator(db)
    if (command === 'status') {
      for (const migration of await migrator.getMigrations()) {
        const when = migration.executedAt?.toISOString() ?? 'pending'
        console.log(`${migration.executedAt ? '✓' : '·'} ${migration.name}  ${when}`)
      }
      return
    }
    if (command !== 'up' && command !== 'down') throw new Error(`Unknown command "${command}".`)
    const result =
      command === 'up' ? await migrator.migrateToLatest() : await migrator.migrateDown()
    for (const step of result.results ?? []) {
      console.log(
        `${step.status === 'Success' ? '✓' : '✗'} ${step.direction} ${step.migrationName}`,
      )
    }
    assertMigrated(result)
    if ((result.results ?? []).length === 0)
      console.log('Nothing to do: the database is up to date.')
  } finally {
    await db.destroy()
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
