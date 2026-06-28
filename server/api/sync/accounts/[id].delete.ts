import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '~~/server/db'
import { connectedAccounts } from '~~/server/db/schema'
import { requireUser } from '~~/server/utils/session'

// Disconnect an account (cascades its calendars + mirrored events).
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const session = await requireUser(event)
  const db = useDb()

  const [owned] = await db
    .select({ id: connectedAccounts.id })
    .from(connectedAccounts)
    .where(and(eq(connectedAccounts.id, id), eq(connectedAccounts.userId, session.user.id)))
    .limit(1)
  if (!owned)
    throw createError({ statusCode: 404, statusMessage: 'Account not found' })

  await db.delete(connectedAccounts).where(eq(connectedAccounts.id, id))
  return { ok: true }
})
