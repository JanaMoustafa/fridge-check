import 'server-only'
import type { Kysely } from 'kysely'
import type { MemberDetails } from '@/lib/account/details'
import type { Database } from '@/lib/db/schema'

/** The member's name (from their account) and phone (from member_contact). */
export async function getDetails(
  db: Kysely<Database>,
  userId: string,
): Promise<MemberDetails | null> {
  const row = await db
    .selectFrom('user')
    .leftJoin('member_contact', 'member_contact.user_id', 'user.id')
    .select(['user.name', 'member_contact.phone'])
    .where('user.id', '=', userId)
    .executeTakeFirst()
  return row ? { name: row.name, phone: row.phone ?? null } : null
}

/** Saves the name on the account and the phone beside it, in one transaction. */
export async function saveDetails(
  db: Kysely<Database>,
  userId: string,
  details: MemberDetails,
  now: Date,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('user')
      .set({ name: details.name, updatedAt: now })
      .where('id', '=', userId)
      .execute()
    await trx
      .insertInto('member_contact')
      .values({ user_id: userId, phone: details.phone, updated_at: now })
      .onConflict((conflict) =>
        conflict.column('user_id').doUpdateSet({ phone: details.phone, updated_at: now }),
      )
      .execute()
  })
}
