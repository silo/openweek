import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '../../database/client'
import { calendarEvent } from '../../database/schema'
import type { ParsedEvent } from './types'

function ymd(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
function hm(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

/** Replace the cached events for a source within the window (read-only mirror). */
export async function storeEvents(
  userId: string,
  sourceId: string,
  tz: string,
  events: ParsedEvent[],
  windowStart: Date,
  windowEnd: Date,
): Promise<number> {
  const wStart = ymd(windowStart, 'UTC')
  const wEnd = ymd(windowEnd, 'UTC')

  await db.delete(calendarEvent).where(and(
    eq(calendarEvent.sourceId, sourceId),
    gte(calendarEvent.localDate, wStart),
    lte(calendarEvent.localDate, wEnd),
  ))

  const rows = events
    .filter(e => e.status !== 'cancelled')
    .map(e => ({
      userId,
      sourceId,
      remoteUid: e.uid,
      title: e.title,
      startAt: e.start,
      endAt: e.end,
      allDay: e.allDay,
      localDate: e.dateOnly ?? ymd(e.start, tz),
      timeLabel: e.allDay ? null : hm(e.start, tz),
      status: 'confirmed' as const,
    }))

  if (rows.length) {
    await db.insert(calendarEvent).values(rows).onConflictDoNothing()
  }
  return rows.length
}
