import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { list, task } from '../../database/schema'
import { requireUserId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const [row] = await db.select().from(list).where(and(eq(list.id, id), eq(list.userId, userId)))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'List not found' })
  const tasks = await db.select().from(task)
    .where(and(eq(task.userId, userId), eq(task.listId, id)))
    .orderBy(asc(task.position), asc(task.id))
  return { list: row, tasks }
})
