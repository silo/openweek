import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { calendarConnection } from '../../database/schema'
import { requireUserId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  // Sources and cached events are removed by ON DELETE CASCADE.
  await db.delete(calendarConnection).where(and(eq(calendarConnection.id, id), eq(calendarConnection.userId, userId)))
  return { ok: true }
})
