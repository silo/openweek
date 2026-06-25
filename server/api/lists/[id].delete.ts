import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '~~/server/db'
import { boards, lists } from '~~/server/db/schema'
import { requireUser } from '~~/server/utils/session'

// Delete a list the user owns. Its tasks cascade (composite FK ON DELETE CASCADE).
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const session = await requireUser(event)
  const db = useDb()

  const [owned] = await db
    .select({ id: lists.id })
    .from(lists)
    .innerJoin(boards, eq(lists.boardId, boards.id))
    .where(and(eq(lists.id, id), eq(boards.userId, session.user.id)))
    .limit(1)
  if (!owned)
    throw createError({ statusCode: 404, statusMessage: 'List not found' })

  await db.delete(lists).where(eq(lists.id, id))
  return { ok: true }
})
