import { z } from 'zod'
import { TASK_COLORS } from '../types/task'

// Request DTOs for the task API — validated on the client (typed input) and
// re-validated on the server. Plain Zod only (no drizzle runtime).

export const taskColorSchema = z.enum(TASK_COLORS)

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a yyyy-MM-dd date')
const uuid = z.uuid()

/**
 * Create a task. The client supplies `id` + `position` (uuid v7 + fractional
 * index) so the optimistic insert matches the persisted row exactly — no id
 * swap, offline-friendly. Either `date` or `listId`, never both (DB CHECK).
 */
export const createTaskInput = z
  .object({
    id: uuid.optional(),
    boardId: uuid,
    title: z.string().trim().min(1, 'Title is required').max(2000),
    date: isoDate.nullish(),
    listId: uuid.nullish(),
    position: z.string().min(1).optional(),
    color: taskColorSchema.nullish(),
    notes: z.string().max(10000).nullish(),
  })
  .refine(d => (d.date != null) !== (d.listId != null), {
    message: 'Provide exactly one of date or listId',
    path: ['date'],
  })
export type CreateTaskInput = z.infer<typeof createTaskInput>

/**
 * Partial update: edit fields, toggle done, set color/notes, or move
 * (date|listId + position). The date|listId XOR is enforced by the DB CHECK and
 * the route's move logic.
 */
export const updateTaskInput = z
  .object({
    title: z.string().trim().min(1).max(2000).optional(),
    notes: z.string().max(10000).nullable().optional(),
    color: taskColorSchema.nullable().optional(),
    done: z.boolean().optional(),
    date: isoDate.nullable().optional(),
    listId: uuid.nullable().optional(),
    position: z.string().min(1).optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'Empty update' })
export type UpdateTaskInput = z.infer<typeof updateTaskInput>

/** Query for the week + list view: day tasks in [from, to] plus all list tasks. */
export const listTasksQuery = z.object({
  boardId: uuid,
  from: isoDate,
  to: isoDate,
})
export type ListTasksQuery = z.infer<typeof listTasksQuery>
