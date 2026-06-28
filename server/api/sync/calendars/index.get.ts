import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { connectedAccounts, externalCalendars } from '~~/server/db/schema'
import { requireUser } from '~~/server/utils/session'

// All external calendars across the user's accounts (with provider + account label).
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  return useDb()
    .select({
      id: externalCalendars.id,
      connectedAccountId: externalCalendars.connectedAccountId,
      externalCalendarId: externalCalendars.externalCalendarId,
      name: externalCalendars.name,
      color: externalCalendars.color,
      enabled: externalCalendars.enabled,
      boardId: externalCalendars.boardId,
      provider: connectedAccounts.provider,
      accountLabel: connectedAccounts.label,
    })
    .from(externalCalendars)
    .innerJoin(connectedAccounts, eq(externalCalendars.connectedAccountId, connectedAccounts.id))
    .where(eq(connectedAccounts.userId, session.user.id))
})
