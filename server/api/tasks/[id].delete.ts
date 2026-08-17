import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { task } from '../../database/schema'
import { requireUserId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  await db.delete(task).where(and(eq(task.id, id), eq(task.userId, userId)))
  return { ok: true }
})
