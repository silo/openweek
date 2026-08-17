import { z } from 'zod'
import { calendarEventDtoSchema } from './calendar'
import { listSchema } from './list'
import { taskSchema } from './task'

export const weekDaySchema = z.object({
  date: z.string(),
  tasks: z.array(taskSchema),
  events: z.array(calendarEventDtoSchema),
})

export const weekPayloadSchema = z.object({
  weekStart: z.string(),
  days: z.array(weekDaySchema),
  lists: z.array(listSchema),
})
export type WeekPayload = z.infer<typeof weekPayloadSchema>
export type WeekDay = z.infer<typeof weekDaySchema>
