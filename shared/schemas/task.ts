import { z } from 'zod'
import { HIGHLIGHT_INKS } from '../constants/colors'

/** The five highlighter inks — defined once in constants/colors.ts. */
export const highlightColorSchema = z.enum(HIGHLIGHT_INKS)

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')

/** A task as returned by the API. */
export const taskSchema = z.object({
  id: z.string(),
  date: z.string().nullable(),
  listId: z.string().nullable(),
  position: z.string(),
  title: z.string(),
  note: z.string().nullable(),
  highlightColor: highlightColorSchema.nullable(),
  timeOfDay: z.string().nullable(),
  completedAt: z.string().nullable(),
  originalDate: z.string().nullable(),
  recurrenceRule: z.string().nullable(),
  sourceEventId: z.string().nullable(),
  sourceLabel: z.string().nullable(),
})
export type Task = z.infer<typeof taskSchema>

/** Create body — the task goes on a date XOR in a list. */
export const taskCreateSchema = z.object({
  title: z.string().min(1).max(1000),
  date: dateStr.optional(),
  listId: z.string().optional(),
  highlightColor: highlightColorSchema.nullable().optional(),
  note: z.string().max(10000).nullable().optional(),
  timeOfDay: z.string().nullable().optional(),
}).refine(d => (d.date == null) !== (d.listId == null), {
  message: 'a task must be on a date XOR in a list',
})
export type TaskCreate = z.infer<typeof taskCreateSchema>

/** Patch body — edit fields, toggle completion, or move (date / listId + position). */
export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(1000).optional(),
  note: z.string().max(10000).nullable().optional(),
  highlightColor: highlightColorSchema.nullable().optional(),
  timeOfDay: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  date: dateStr.nullable().optional(),
  listId: z.string().nullable().optional(),
  position: z.string().optional(),
})
export type TaskUpdate = z.infer<typeof taskUpdateSchema>
