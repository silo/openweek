import { expandTaskRecurrence } from '#shared/utils/recurrence'
import { and, between, eq, isNotNull } from 'drizzle-orm'
import { listTasksQuery } from '#shared/schemas/task'
import { tasks } from '~~/server/db/schema'
import { loadOwnedBoard, nextPositionInScope } from '~~/server/utils/ownership'

/**
 * Materialize missing recurring-task instances for the visible week. A template
 * (recurrenceRule set) renders as its first occurrence; this inserts real rows
 * for the other occurrences in [from, to] so they stay draggable/checkable.
 * Idempotent via the partial unique index (recurrence_id, date) + an existence
 * check. Called by the store on week load (never an SSR side-effect).
 */
export default defineEventHandler(async (event) => {
  const { boardId, from, to } = await readValidatedBody(event, listTasksQuery.parse)
  const { db, board } = await loadOwnedBoard(event, boardId)

  const templates = await db
    .select({ id: tasks.id, title: tasks.title, color: tasks.color, date: tasks.date, rule: tasks.recurrenceRule })
    .from(tasks)
    .where(and(eq(tasks.boardId, board.id), isNotNull(tasks.recurrenceRule), isNotNull(tasks.date)))

  if (templates.length === 0)
    return { materialized: 0 }

  // Existing instances in the window → skip set.
  const existing = await db
    .select({ recurrenceId: tasks.recurrenceId, date: tasks.date })
    .from(tasks)
    .where(and(eq(tasks.boardId, board.id), isNotNull(tasks.recurrenceId), between(tasks.date, from, to)))
  const seen = new Set(existing.map(e => `${e.recurrenceId}|${e.date}`))

  let materialized = 0
  for (const t of templates) {
    const occurrences = expandTaskRecurrence(t.date!, t.rule!, from, to)
    for (const occ of occurrences) {
      if (occ === t.date)
        continue // the template covers its own date
      if (seen.has(`${t.id}|${occ}`))
        continue
      const position = await nextPositionInScope(db, board.id, { date: occ })
      await db.insert(tasks).values({
        boardId: board.id,
        title: t.title,
        date: occ,
        position,
        color: t.color,
        recurrenceId: t.id,
      }).onConflictDoNothing()
      seen.add(`${t.id}|${occ}`)
      materialized++
    }
  }

  return { materialized }
})
