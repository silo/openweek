import { z } from 'zod'
import { calendarEventDtoSchema } from './calendar'
import { listSchema } from './list'
import { taskSchema } from './task'

export const weekDaySchema = z.object({
  date: z.string(),
  tasks: z.array(taskSchema),
  events: z.array(calendarEventDtoSchema),
})

/**
 * Lists arrive with their tasks: the design's rail shows every list at once as a card, so
 * there is no "active list" to fetch separately.
 */
export const listWithTasksSchema = listSchema.extend({
  tasks: z.array(taskSchema),
})

export const weekPayloadSchema = z.object({
  weekStart: z.string(),
  days: z.array(weekDaySchema),
  lists: z.array(listWithTasksSchema),
})
export type WeekPayload = z.infer<typeof weekPayloadSchema>
export type WeekDay = z.infer<typeof weekDaySchema>
export type ListWithTasks = z.infer<typeof listWithTasksSchema>
