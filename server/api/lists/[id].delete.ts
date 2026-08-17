import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { list } from '../../database/schema'
import { requireUserId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const [row] = await db.select().from(list).where(and(eq(list.id, id), eq(list.userId, userId)))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'List not found' })
  if (row.isDefault) throw createError({ statusCode: 400, statusMessage: 'Cannot delete the default list' })
  // Tasks in the list are removed by the ON DELETE CASCADE foreign key.
  await db.delete(list).where(and(eq(list.id, id), eq(list.userId, userId)))
  return { ok: true }
})
