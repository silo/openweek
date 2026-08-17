import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { list } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { listUpdateSchema } from '~~/shared/schemas/list'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const input = listUpdateSchema.parse(await readBody(event))
  const [row] = await db.update(list)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(list.id, id), eq(list.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'List not found' })
  return row
})
