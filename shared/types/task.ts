// Plain client/server-shared types. NO drizzle/Vue/Nitro imports (see
// docs/architecture.md — keeps the DB layer out of the client bundle).

export const TASK_COLORS = ['yellow', 'pink', 'blue', 'green'] as const
export type TaskColor = (typeof TASK_COLORS)[number]

/** A task as returned by the API (serialized row). */
export interface Task {
  id: string
  boardId: string
  title: string
  notes: string | null
  date: string | null // yyyy-MM-dd (day column) — null ⇒ lives in a list
  listId: string | null // null ⇒ lives on a date
  position: string // fractional index within its day or list
  color: TaskColor | null
  done: boolean
  rolledOverFrom: string | null
  startTime: string | null // 'HH:mm' label, not hourly scheduling
  recurrenceRule: string | null // RRULE on a template row
  recurrenceId: string | null // → template task id (this row is a generated instance)
  parentId: string | null // → parent task id (this row is a subtask)
  linkedEventId: string | null // → source calendar event (convert-to-task)
  createdAt: string
  updatedAt: string
}

export interface List {
  id: string
  boardId: string
  name: string
  color: string | null
  position: string
}

/** A connected external calendar account (display shape — never carries secrets). */
export interface ConnectedAccount {
  id: string
  provider: 'google' | 'caldav' | 'ical'
  label: string
  caldavUrl: string | null
  icalUrl: string | null
  lastSyncedAt: string | null
}

export interface ExternalCalendar {
  id: string
  connectedAccountId: string
  externalCalendarId: string
  name: string | null
  color: string | null
  enabled: boolean
  boardId: string | null
}

/** A read-only calendar event occurrence expanded for the grid. */
export interface SyncedEventOccurrence {
  id: string
  externalCalendarId: string
  calendarName: string | null
  provider: 'google' | 'caldav' | 'ical'
  title: string | null
  date: string // yyyy-MM-dd the occurrence falls on
  startTime: string | null // 'HH:mm' or null for all-day
  allDay: boolean
}

export interface Board {
  id: string
  userId: string
  name: string
  color: string | null
  position: string
  isDefault: boolean
}
