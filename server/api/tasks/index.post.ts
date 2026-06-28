import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { createTaskInput } from '#shared/schemas/task'
import { lists, tasks } from '~~/server/db/schema'
import { loadOwnedBoard, nextPositionInScope } from '~~/server/utils/ownership'

// Create a task on a date or in a list. The DB CHECK guarantees exactly one of
// date|listId; we also verify the list belongs to the board for a clean 400.
export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, createTaskInput.parse)
  const { db, board } = await loadOwnedBoard(event, input.boardId)

  if (input.listId != null) {
    const [list] = await db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.id, input.listId), eq(lists.boardId, board.id)))
      .limit(1)
    if (!list)
      throw createError({ statusCode: 400, statusMessage: 'List does not belong to this board' })
  }

  // Subtask: the parent must be on this board and itself be top-level (depth-1).
  if (input.parentId != null) {
    const [parent] = await db
      .select({ parentId: tasks.parentId })
      .from(tasks)
      .where(and(eq(tasks.id, input.parentId), eq(tasks.boardId, board.id)))
      .limit(1)
    if (!parent)
      throw createError({ statusCode: 400, statusMessage: 'Parent task does not belong to this board' })
    if (parent.parentId != null)
      throw createError({ statusCode: 400, statusMessage: 'Subtasks cannot be nested' })
  }

  const scope = input.listId != null
    ? { listId: input.listId }
    : { date: input.date! }
  const position = input.position ?? await nextPositionInScope(db, board.id, scope)

  const [row] = await db
    .insert(tasks)
    .values({
      id: input.id ?? uuidv7(),
      boardId: board.id,
      title: input.title,
      notes: input.notes ?? null,
      date: input.date ?? null,
      listId: input.listId ?? null,
      position,
      color: input.color ?? null,
      startTime: input.startTime ?? null,
      parentId: input.parentId ?? null,
    })
    .returning()
  return row
})
