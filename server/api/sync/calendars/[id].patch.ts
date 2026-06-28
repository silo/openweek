import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { updateCalendarInput } from '#shared/schemas/sync'
import { useDb } from '~~/server/db'
import { connectedAccounts, externalCalendars } from '~~/server/db/schema'
import { requireUser } from '~~/server/utils/session'

// Toggle a calendar's visibility / map it to a board (ownership via its account).
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const input = await readValidatedBody(event, updateCalendarInput.parse)
  const session = await requireUser(event)
  const db = useDb()

  const [owned] = await db
    .select({ id: externalCalendars.id })
    .from(externalCalendars)
    .innerJoin(connectedAccounts, eq(externalCalendars.connectedAccountId, connectedAccounts.id))
    .where(and(eq(externalCalendars.id, id), eq(connectedAccounts.userId, session.user.id)))
    .limit(1)
  if (!owned)
    throw createError({ statusCode: 404, statusMessage: 'Calendar not found' })

  const [row] = await db.update(externalCalendars).set(input).where(eq(externalCalendars.id, id)).returning()
  return row
})
