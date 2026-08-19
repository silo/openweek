import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { task } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { PAST_DATE_MESSAGE, userToday } from '../../utils/today'
import { keyBetween } from '../../services/ordering'
import { taskUpdateSchema } from '~~/shared/schemas/task'
import { isPastDate } from '~~/shared/utils/week'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const input = taskUpdateSchema.parse(await readBody(event))

  // No moving a task into the past — except back to the day it rolled off, which is the
  // rollover banner's "send back" and restores a date the task already had.
  if (input.date != null && isPastDate(input.date, await userToday(userId))) {
    const [existing] = await db.select({ originalDate: task.originalDate }).from(task)
      .where(and(eq(task.id, id), eq(task.userId, userId)))
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Task not found' })
    if (existing.originalDate !== input.date) {
      throw createError({ statusCode: 400, statusMessage: PAST_DATE_MESSAGE })
    }
  }

  const updates: Partial<typeof task.$inferInsert> = { updatedAt: new Date() }
  if (input.title !== undefined) updates.title = input.title
  if (input.note !== undefined) updates.note = input.note
  if (input.highlightColor !== undefined) updates.highlightColor = input.highlightColor
  if (input.timeOfDay !== undefined) updates.timeOfDay = input.timeOfDay
  if (input.completed !== undefined) updates.completedAt = input.completed ? new Date() : null
  if (input.position !== undefined) updates.position = input.position
  // Move: a task is on a date XOR in a list, so setting one clears the other.
  if (input.date != null) { updates.date = input.date; updates.listId = null }
  if (input.listId != null) { updates.listId = input.listId; updates.date = null }

  // On a bucket change, append to the destination unless the client set a position.
  if ((input.date != null || input.listId != null) && input.position === undefined) {
    const bucket = input.date != null ? eq(task.date, input.date) : eq(task.listId, input.listId!)
    const [last] = await db.select({ position: task.position }).from(task)
      .where(and(eq(task.userId, userId), bucket))
      .orderBy(desc(task.position)).limit(1)
    updates.position = keyBetween(last?.position ?? null, null)
  }

  const [row] = await db.update(task).set(updates)
    .where(and(eq(task.id, id), eq(task.userId, userId)))
    .returning()

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  return row
})
