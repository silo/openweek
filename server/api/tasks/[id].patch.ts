import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { updateTaskInput } from '#shared/schemas/task'
import { ruleToRrule } from '#shared/utils/recurrence'
import { lists, tasks } from '~~/server/db/schema'
import { loadOwnedTask } from '~~/server/utils/ownership'

// Edit / toggle / color / note / move a task. A move sets date|listId as a
// mutually-exclusive pair so the DB CHECK is never violated.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const input = await readValidatedBody(event, updateTaskInput.parse)
  const { db, task } = await loadOwnedTask(event, id)

  const patch: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() }

  if (input.title !== undefined)
    patch.title = input.title
  if (input.notes !== undefined)
    patch.notes = input.notes
  if (input.color !== undefined)
    patch.color = input.color
  if (input.done !== undefined)
    patch.done = input.done
  if (input.position !== undefined)
    patch.position = input.position
  if (input.startTime !== undefined)
    patch.startTime = input.startTime
  if (input.recurrence !== undefined)
    patch.recurrenceRule = input.recurrence ? ruleToRrule(input.recurrence) : null

  // Move: to a date clears listId; to a list clears date and must stay on-board.
  if (input.date != null) {
    patch.date = input.date
    patch.listId = null
  }
  else if (input.listId != null) {
    const [list] = await db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.id, input.listId), eq(lists.boardId, task.boardId)))
      .limit(1)
    if (!list)
      throw createError({ statusCode: 400, statusMessage: 'List does not belong to this board' })
    patch.listId = input.listId
    patch.date = null
  }

  const [row] = await db.update(tasks).set(patch).where(eq(tasks.id, id)).returning()
  return row
})
