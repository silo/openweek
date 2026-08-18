import { and, asc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../../database/client'
import { calendarConnection, calendarEvent, calendarSource } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { eachDay, todayStr } from '~~/shared/utils/week'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  // The calendars UI shows "N events this week" per calendar, so counts are scoped to the
  // week being viewed; default to the current one.
  const q = getQuery(event)
  const weekStart = typeof q.start === 'string' ? q.start : todayStr()
  const dates = eachDay(weekStart, 7)

  const connections = await db.select({
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

  const sources = await db.select({
    id: calendarSource.id,
    connectionId: calendarSource.connectionId,
    name: calendarSource.name,
    color: calendarSource.color,
    enabled: calendarSource.enabled,
    eventCount: sql<number>`count(${calendarEvent.id})::int`,
  }).from(calendarSource)
    .innerJoin(calendarConnection, eq(calendarSource.connectionId, calendarConnection.id))
    .leftJoin(calendarEvent, and(
      eq(calendarEvent.sourceId, calendarSource.id),
      eq(calendarEvent.status, 'confirmed'),
      gte(calendarEvent.localDate, dates[0]!),
      lte(calendarEvent.localDate, dates[6]!),
    ))
    .where(eq(calendarConnection.userId, userId))
    .groupBy(calendarSource.id)
    .orderBy(asc(calendarSource.name))

  return connections.map(c => ({
    ...c,
    sources: sources.filter(s => s.connectionId === c.id),
  }))
})
