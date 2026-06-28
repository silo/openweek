import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { convertEventInput } from '#shared/schemas/sync'
import { useDb } from '~~/server/db'
import { boards, connectedAccounts, externalCalendars, syncedEvents, tasks } from '~~/server/db/schema'
import { nextPositionInScope } from '~~/server/utils/ownership'
import { requireUser } from '~~/server/utils/session'

const pad = (n: number) => String(n).padStart(2, '0')

// Convert a mirrored calendar event into a real task on the given date,
// optionally keeping a link back to the source event.
export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, convertEventInput.parse)
  const session = await requireUser(event)
  const db = useDb()

  // The event must belong to a calendar the user owns; resolve its target board.
  const [ev] = await db
    .select({
      title: syncedEvents.title,
      start: syncedEvents.start,
      allDay: syncedEvents.allDay,
      boardId: externalCalendars.boardId,
    })
    .from(syncedEvents)
    .innerJoin(externalCalendars, eq(syncedEvents.externalCalendarId, externalCalendars.id))
    .innerJoin(connectedAccounts, eq(externalCalendars.connectedAccountId, connectedAccounts.id))
    .where(and(eq(syncedEvents.id, input.syncedEventId), eq(connectedAccounts.userId, session.user.id)))
    .limit(1)
  if (!ev)
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })

  let boardId = ev.boardId
  if (!boardId) {
    const [b] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(and(eq(boards.userId, session.user.id), eq(boards.isDefault, true)))
      .limit(1)
    boardId = b?.id ?? null
  }
  if (!boardId)
    throw createError({ statusCode: 400, statusMessage: 'No board to add the task to' })

  const startTime = !ev.allDay && ev.start ? `${pad(ev.start.getHours())}:${pad(ev.start.getMinutes())}` : null
  const position = await nextPositionInScope(db, boardId, { date: input.date })

  const [task] = await db.insert(tasks).values({
    id: uuidv7(),
    boardId,
    title: ev.title ?? 'Event',
    date: input.date,
    position,
    startTime,
    linkedEventId: input.keepLinked ? input.syncedEventId : null,
  }).returning()

  return task
})
