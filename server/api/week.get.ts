import { and, asc, eq, gte, isNull, lte } from 'drizzle-orm'
import { db } from '../database/client'
import { calendarConnection, calendarEvent, calendarSource, list, task, userSettings } from '../database/schema'
import { requireUserId } from '../utils/session'
import { ensureDefaultList } from '../services/lists'
import { rolloverForUser } from '../services/rollover'
import { eachDay, todayInTz, todayStr } from '~~/shared/utils/week'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const q = getQuery(event)
  const weekStart = typeof q.start === 'string' ? q.start : todayStr()
  const dates = eachDay(weekStart, 7)
  const endDate = dates[6]!

  const [settings] = await db.select({
    rolloverEnabled: userSettings.rolloverEnabled,
    showCalendarEvents: userSettings.showCalendarEvents,
    timezone: userSettings.timezone,
  }).from(userSettings).where(eq(userSettings.userId, userId))

  if (settings?.rolloverEnabled) {
    await rolloverForUser(userId, todayInTz(settings.timezone))
  }

  const rows = await db.select().from(task)
    .where(and(eq(task.userId, userId), gte(task.date, weekStart), lte(task.date, endDate)))
    .orderBy(asc(task.position), asc(task.id))

  await ensureDefaultList(userId)
  const lists = await db.select().from(list)
    .where(and(eq(list.userId, userId), isNull(list.archivedAt)))
    .orderBy(asc(list.position), asc(list.id))

  const events = (settings?.showCalendarEvents ?? true)
    ? await db.select({
        id: calendarEvent.id,
        title: calendarEvent.title,
        timeLabel: calendarEvent.timeLabel,
        localDate: calendarEvent.localDate,
        provider: calendarConnection.provider,
        color: calendarSource.color,
        sourceName: calendarSource.name,
      }).from(calendarEvent)
        .innerJoin(calendarSource, eq(calendarEvent.sourceId, calendarSource.id))
        .innerJoin(calendarConnection, eq(calendarSource.connectionId, calendarConnection.id))
        .where(and(
          eq(calendarEvent.userId, userId),
          gte(calendarEvent.localDate, weekStart),
          lte(calendarEvent.localDate, endDate),
          eq(calendarSource.enabled, true),
          eq(calendarEvent.status, 'confirmed'),
        ))
        .orderBy(asc(calendarEvent.startAt))
    : []

  const days = dates.map(date => ({
    date,
    tasks: rows.filter(r => r.date === date),
    events: events.filter(e => e.localDate === date),
  }))
  return { weekStart, days, lists }
})
