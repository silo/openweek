import { and, eq } from 'drizzle-orm'
import { db } from '../../../database/client'
import { calendarConnection } from '../../../database/schema'
import { requireUserId } from '../../../utils/session'
import { syncConnection } from '../../../services/calendar/sync'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const [conn] = await db.select({ id: calendarConnection.id }).from(calendarConnection)
    .where(and(eq(calendarConnection.id, id), eq(calendarConnection.userId, userId)))
  if (!conn) throw createError({ statusCode: 404, statusMessage: 'Connection not found' })
  await syncConnection(conn.id)
  return { ok: true }
})
