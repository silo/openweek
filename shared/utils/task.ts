import type { Task } from '../schemas/task'

/**
 * Has this task been carried onto a later day than the one it was written on?
 *
 * `originalDate` is set by rollover and never cleared, so it alone does not mean the task
 * is still displaced — sending it back leaves the column set while the task sits on its
 * original day again. The comparison lives here so the ↻ marker and the rollover review
 * banner cannot drift apart.
 */
export function isRolledOver(task: Pick<Task, 'date' | 'originalDate'>): boolean {
  return !!task.originalDate && !!task.date && task.originalDate < task.date
}

/** The id an optimistically-added task wears until the server answers with a real one. */
export const TEMP_ID_PREFIX = 'temp-'

/**
 * A task the server has not acknowledged yet. Its id is a placeholder, so anything that
 * would address the row by id — completing it, editing it, deleting it — has nothing to
 * address until the create round-trips.
 */
export function isPending(task: Pick<Task, 'id'>): boolean {
  return task.id.startsWith(TEMP_ID_PREFIX)
}
