import { and, eq } from 'drizzle-orm'
import { db } from '../../../database/client'
import { calendarConnection, calendarSource } from '../../../database/schema'
import { requireUserId } from '../../../utils/session'
import { calendarSourceUpdateSchema } from '~~/shared/schemas/calendar'

/** Show/hide, rename or recolour one calendar. Nothing is changed upstream. */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const patch = calendarSourceUpdateSchema.parse(await readBody(event))

  // calendar_source has no userId of its own — scope through its connection.
  const [owned] = await db.select({ id: calendarSource.id })
    .from(calendarSource)
    .innerJoin(calendarConnection, eq(calendarSource.connectionId, calendarConnection.id))
    .where(and(eq(calendarSource.id, id), eq(calendarConnection.userId, userId)))

  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Calendar not found' })

  const [row] = await db.update(calendarSource)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(calendarSource.id, id))
    .returning()
  return row
})
