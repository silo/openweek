import { z } from 'zod'

// Request DTOs for the calendar-sync API. Plain Zod only (no drizzle runtime).

const uuid = z.uuid()

export const connectCaldavInput = z.object({
  label: z.string().trim().min(1).max(200),
  serverUrl: z.url(),
  username: z.string().min(1),
  password: z.string().min(1),
})
export type ConnectCaldavInput = z.infer<typeof connectCaldavInput>

export const connectIcalInput = z.object({
  label: z.string().trim().min(1).max(200),
  url: z.url(),
})
export type ConnectIcalInput = z.infer<typeof connectIcalInput>

export const updateCalendarInput = z
  .object({
    enabled: z.boolean().optional(),
    boardId: uuid.nullable().optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'Empty update' })
export type UpdateCalendarInput = z.infer<typeof updateCalendarInput>

export const convertEventInput = z.object({
  syncedEventId: uuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keepLinked: z.boolean().default(true),
})
export type ConvertEventInput = z.infer<typeof convertEventInput>

export const eventsQuery = z.object({
  boardId: uuid,
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type EventsQuery = z.infer<typeof eventsQuery>
