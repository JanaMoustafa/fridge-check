import 'server-only'
import type { Kysely } from 'kysely'
import type { TrainingChoice } from '@/lib/burn/programme'
import type { Database } from '@/lib/db/schema'

/** The member's BurnToReturn choice, or null before they have chosen. */
export async function getTrainingChoice(
  db: Kysely<Database>,
  userId: string,
): Promise<TrainingChoice | null> {
  const row = await db
    .selectFrom('training_plan')
    .select(['style', 'days'])
    .where('user_id', '=', userId)
    .executeTakeFirst()
  return row ?? null
}

export async function saveTrainingChoice(
  db: Kysely<Database>,
  userId: string,
  choice: TrainingChoice,
  now: Date,
): Promise<void> {
  await db
    .insertInto('training_plan')
    .values({ user_id: userId, style: choice.style, days: choice.days, updated_at: now })
    .onConflict((conflict) =>
      conflict
        .column('user_id')
        .doUpdateSet({ style: choice.style, days: choice.days, updated_at: now }),
    )
    .execute()
}
