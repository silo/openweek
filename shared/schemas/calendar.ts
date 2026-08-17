import { z } from 'zod'

const httpUrl = z.string().regex(/^https?:\/\//, 'must be an http(s) URL')

/** Connect body (Google uses its own OAuth flow, not this endpoint). */
export const connectSchema = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('ical'), url: httpUrl, displayName: z.string().max(200).optional() }),
  z.object({
    provider: z.literal('caldav'),
    serverUrl: httpUrl,
    username: z.string().min(1),
    password: z.string().min(1),
    displayName: z.string().max(200).optional(),
  }),
])
export type ConnectInput = z.infer<typeof connectSchema>

/** An imported event as rendered in the grid. */
export const calendarEventDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  timeLabel: z.string().nullable(),
  localDate: z.string(),
  provider: z.enum(['google', 'caldav', 'ical']),
  color: z.string(),
  sourceName: z.string(),
})
export type CalendarEventDto = z.infer<typeof calendarEventDtoSchema>

export const calendarConnectionDtoSchema = z.object({
  id: z.string(),
  provider: z.enum(['google', 'caldav', 'ical']),
  displayName: z.string(),
  color: z.string(),
  status: z.enum(['active', 'error', 'reauth_required']),
  lastError: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
})
export type CalendarConnectionDto = z.infer<typeof calendarConnectionDtoSchema>

export const convertEventSchema = z.object({
  keepLinked: z.boolean().default(true),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
export type ConvertEventInput = z.infer<typeof convertEventSchema>
