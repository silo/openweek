import { and, asc, eq, gte, isNotNull, lte, or } from 'drizzle-orm'
import { listTasksQuery } from '#shared/schemas/task'
import { tasks } from '~~/server/db/schema'
import { loadOwnedBoard } from '~~/server/utils/ownership'

// All tasks needed for the view: day tasks within [from, to] plus every list
// (Someday) task. Always ordered (position, id).
export default defineEventHandler(async (event) => {
  const { boardId, from, to } = await getValidatedQuery(event, listTasksQuery.parse)
  const { db, board } = await loadOwnedBoard(event, boardId)

  return db
    .select()
    .from(tasks)
    .where(and(
      eq(tasks.boardId, board.id),
      or(
        and(gte(tasks.date, from), lte(tasks.date, to)),
        isNotNull(tasks.listId),
      ),
    ))
    .orderBy(asc(tasks.position), asc(tasks.id))
})
