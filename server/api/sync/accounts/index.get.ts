import { asc, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { connectedAccounts } from '~~/server/db/schema'
import { requireUser } from '~~/server/utils/session'

// The user's connected accounts (display shape — never returns secrets).
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  return useDb()
    .select({
      id: connectedAccounts.id,
      provider: connectedAccounts.provider,
      label: connectedAccounts.label,
      caldavUrl: connectedAccounts.caldavUrl,
      icalUrl: connectedAccounts.icalUrl,
      lastSyncedAt: connectedAccounts.lastSyncedAt,
    })
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, session.user.id))
    .orderBy(asc(connectedAccounts.createdAt))
})
