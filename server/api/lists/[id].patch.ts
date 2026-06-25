import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { updateListInput } from '#shared/schemas/list'
import { useDb } from '~~/server/db'
import { boards, lists } from '~~/server/db/schema'
import { requireUser } from '~~/server/utils/session'

// Rename / reorder a list the user owns.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const input = await readValidatedBody(event, updateListInput.parse)
  const session = await requireUser(event)
  const db = useDb()

  // Ownership: the list's board must belong to the user.
  const [owned] = await db
    .select({ id: lists.id })
    .from(lists)
    .innerJoin(boards, eq(lists.boardId, boards.id))
    .where(and(eq(lists.id, id), eq(boards.userId, session.user.id)))
    .limit(1)
  if (!owned)
    throw createError({ statusCode: 404, statusMessage: 'List not found' })

  const [row] = await db.update(lists).set(input).where(eq(lists.id, id)).returning()
  return row
})
