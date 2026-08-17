import { asc, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { calendarConnection } from '../../database/schema'
import { requireUserId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return db.select({
    id: calendarConnection.id,
    provider: calendarConnection.provider,
    displayName: calendarConnection.displayName,
    color: calendarConnection.color,
    status: calendarConnection.status,
    lastError: calendarConnection.lastError,
    lastSyncedAt: calendarConnection.lastSyncedAt,
  }).from(calendarConnection)
    .where(eq(calendarConnection.userId, userId))
    .orderBy(asc(calendarConnection.createdAt))
})
