import type { H3Event } from 'h3'
import { and, desc, eq } from 'drizzle-orm'
import { generateKeyBetween } from 'fractional-indexing-jittered'
import { useDb } from '../db'
import { boards, tasks } from '../db/schema'
import { requireUser } from './session'

/** Load a board owned by the session user, or 404. */
export async function loadOwnedBoard(event: H3Event, boardId: string) {
  const session = await requireUser(event)
  const db = useDb()
  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, session.user.id)))
    .limit(1)
  if (!board)
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  return { session, db, board }
}

/** Load a task owned by the session user (via its board), or 404. */
export async function loadOwnedTask(event: H3Event, taskId: string) {
  const session = await requireUser(event)
  const db = useDb()
  const [row] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(boards, eq(tasks.boardId, boards.id))
    .where(and(eq(tasks.id, taskId), eq(boards.userId, session.user.id)))
    .limit(1)
  if (!row)
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  return { session, db, task: row.task }
}

type DB = ReturnType<typeof useDb>

/** Fractional position appended after the last task in a day or list scope (DB-backed). */
export async function nextPositionInScope(
  db: DB,
  boardId: string,
  scope: { date: string } | { listId: string },
) {
  const where = 'listId' in scope
    ? and(eq(tasks.boardId, boardId), eq(tasks.listId, scope.listId))
    : and(eq(tasks.boardId, boardId), eq(tasks.date, scope.date))

  const [last] = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.position), desc(tasks.id))
    .limit(1)

  return generateKeyBetween(last?.position ?? null, null)
}
