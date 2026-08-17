import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../database/client'
import { list, task } from '../database/schema'
import { requireUserId } from '../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const q = String(getQuery(event).q ?? '').trim()
  if (!q) return []
  const pattern = `%${q}%`
  return db.select({
    id: task.id,
    title: task.title,
    date: task.date,
    listId: task.listId,
    listName: list.name,
    completedAt: task.completedAt,
  }).from(task)
    .leftJoin(list, eq(task.listId, list.id))
    .where(and(eq(task.userId, userId), or(ilike(task.title, pattern), ilike(task.note, pattern))))
    .orderBy(sql`${task.completedAt} nulls first`, sql`${task.date} desc nulls last`)
    .limit(50)
})
