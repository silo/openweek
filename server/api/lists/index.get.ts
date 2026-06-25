import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { lists } from '~~/server/db/schema'
import { loadOwnedBoard } from '~~/server/utils/ownership'

const query = z.object({ boardId: z.uuid() })

// Lists (Someday / custom columns) for a board the user owns.
export default defineEventHandler(async (event) => {
  const { boardId } = await getValidatedQuery(event, query.parse)
  const { db, board } = await loadOwnedBoard(event, boardId)
  return db
    .select()
    .from(lists)
    .where(eq(lists.boardId, board.id))
    .orderBy(asc(lists.position), asc(lists.id))
})
