import { z } from 'zod'
import { HIGHLIGHT_INKS } from '../constants/colors'

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
  /** Lets the client hide events when their calendar is switched off. */
  sourceId: z.string(),
  title: z.string(),
  timeLabel: z.string().nullable(),
  localDate: z.string(),
  provider: z.enum(['google', 'caldav', 'ical']),
  color: z.string(),
  sourceName: z.string(),
})
export type CalendarEventDto = z.infer<typeof calendarEventDtoSchema>

/** One calendar within a connection — a row in the calendars menu and in Settings. */
export const calendarSourceDtoSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  name: z.string(),
  color: z.string(),
  enabled: z.boolean(),
  /** Events this calendar contributes to the week being shown. */
  eventCount: z.number(),
})
export type CalendarSourceDto = z.infer<typeof calendarSourceDtoSchema>

export const calendarSourceUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  color: z.enum(HIGHLIGHT_INKS).optional(),
  enabled: z.boolean().optional(),
})
export type CalendarSourceUpdate = z.infer<typeof calendarSourceUpdateSchema>

export const calendarConnectionDtoSchema = z.object({
  id: z.string(),
  provider: z.enum(['google', 'caldav', 'ical']),
  displayName: z.string(),
  color: z.string(),
  status: z.enum(['active', 'error', 'reauth_required']),
  lastError: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
  sources: z.array(calendarSourceDtoSchema),
})
export type CalendarConnectionDto = z.infer<typeof calendarConnectionDtoSchema>

export const convertEventSchema = z.object({
  keepLinked: z.boolean().default(true),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
export type ConvertEventInput = z.infer<typeof convertEventSchema>
