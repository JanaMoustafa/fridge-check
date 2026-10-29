import { getSignedInUser } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { getDb } from '@/lib/db/client'
import { handleReadRequest, READS_PER_HOUR } from '@/lib/server/inbody-read-request'
import { readInbodyPhoto } from '@/lib/server/inbody-reader'
import { createRateLimiter } from '@/lib/server/rate-limit'

/** Reading a photo with Claude usually takes a few seconds; allow for a slow one. */
export const maxDuration = 60

const limiter = createRateLimiter({ limit: READS_PER_HOUR, windowMs: 60 * 60 * 1000 })

export async function POST(request: Request) {
  return handleReadRequest(request, {
    userId: async () => (await getSignedInUser())?.id ?? null,
    isPro: async (userId) => (await getProAccess(getDb(), userId, new Date())).isPro,
    limiter,
    read: (image) => readInbodyPhoto(image),
  })
}
