import type { SyncedEventOccurrence } from '#shared/types/task'
import { and, eq, inArray, ne, or, isNull } from 'drizzle-orm'
import { eventsQuery } from '#shared/schemas/sync'
import { connectedAccounts, externalCalendars, syncedEvents } from '~~/server/db/schema'
import { expandMaster } from '~~/server/utils/event-expansion'
import { loadOwnedBoard } from '~~/server/utils/ownership'

/**
 * Read-only calendar occurrences for the visible week. Reads stored masters for
 * the enabled calendars mapped to this board and expands recurrence on the fly.
 */
export default defineEventHandler(async (event) => {
  const { boardId, from, to } = await getValidatedQuery(event, eventsQuery.parse)
  const { db } = await loadOwnedBoard(event, boardId)

  // Enabled calendars mapped to this board (or the user's default board → null boardId).
  const cals = await db
    .select({
      id: externalCalendars.id,
      name: externalCalendars.name,
      provider: connectedAccounts.provider,
    })
    .from(externalCalendars)
    .innerJoin(connectedAccounts, eq(externalCalendars.connectedAccountId, connectedAccounts.id))
    .where(and(
      eq(externalCalendars.enabled, true),
      or(eq(externalCalendars.boardId, boardId), isNull(externalCalendars.boardId)),
    ))

  if (cals.length === 0)
    return [] as SyncedEventOccurrence[]

  const calById = new Map(cals.map(c => [c.id, c]))
  const rows = await db
    .select()
    .from(syncedEvents)
    .where(and(
      inArray(syncedEvents.externalCalendarId, cals.map(c => c.id)),
      ne(syncedEvents.status, 'cancelled'),
    ))

  const out: SyncedEventOccurrence[] = []
  for (const ev of rows) {
    if (!ev.start)
      continue
    const cal = calById.get(ev.externalCalendarId)
    if (!cal)
      continue
    const occ = expandMaster(
      { start: ev.start, allDay: ev.allDay, rrule: ev.rrule, exdates: (ev.exdates as string[] | null) ?? [] },
      from,
      to,
    )
    for (const o of occ) {
      out.push({
        id: `${ev.id}:${o.date}`,
        externalCalendarId: ev.externalCalendarId,
        calendarName: cal.name,
        provider: cal.provider as 'google' | 'caldav' | 'ical',
        title: ev.title,
        date: o.date,
        startTime: o.startTime,
        allDay: o.allDay,
      })
    }
  }
  return out
})
