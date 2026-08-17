import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../../database/client'
import { calendarConnection, calendarEvent, calendarSource, task } from '../../../database/schema'
import { requireUserId } from '../../../utils/session'
import { keyBetween } from '../../../services/ordering'
import { convertEventSchema } from '~~/shared/schemas/calendar'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event).catch(() => null)
  const input = convertEventSchema.parse(body ?? {})

  const [ev] = await db.select({
    id: calendarEvent.id,
    title: calendarEvent.title,
    localDate: calendarEvent.localDate,
    timeLabel: calendarEvent.timeLabel,
    displayName: calendarConnection.displayName,
  }).from(calendarEvent)
    .innerJoin(calendarSource, eq(calendarEvent.sourceId, calendarSource.id))
    .innerJoin(calendarConnection, eq(calendarSource.connectionId, calendarConnection.id))
    .where(and(eq(calendarEvent.id, id), eq(calendarEvent.userId, userId)))
  if (!ev) throw createError({ statusCode: 404, statusMessage: 'Event not found' })

  const date = input.date ?? ev.localDate
  const [last] = await db.select({ position: task.position }).from(task)
    .where(and(eq(task.userId, userId), eq(task.date, date)))
    .orderBy(desc(task.position)).limit(1)

  const [row] = await db.insert(task).values({
    userId,
    title: ev.title,
    date,
    position: keyBetween(last?.position ?? null, null),
    timeOfDay: ev.timeLabel ? `${ev.timeLabel}:00` : null,
    sourceEventId: input.keepLinked ? ev.id : null,
    sourceLabel: input.keepLinked ? ev.displayName : null,
  }).returning()
  return row
})
