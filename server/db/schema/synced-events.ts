import { sql } from 'drizzle-orm'
import { boolean, check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { externalCalendars } from './external-calendars'

/**
 * Read-only mirror of external events. Store series MASTERS + overrides and
 * expand the visible week on read (don't persist every occurrence) — keeps the
 * table small and prev/next-week nav correct without a re-sync. See
 * docs/calendar-sync.md. SERVER ONLY.
 */
export const syncedEvents = pgTable('synced_events', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  externalCalendarId: uuid('external_calendar_id').notNull().references(() => externalCalendars.id, { onDelete: 'cascade' }),
  uid: text('uid').notNull(),
  recurrenceId: text('recurrence_id'), // RECURRENCE-ID of an overridden instance
  title: text('title'),
  start: timestamp('start', { withTimezone: true }),
  end: timestamp('end', { withTimezone: true }),
  startTz: text('start_tz'),
  endTz: text('end_tz'),
  allDay: boolean('all_day').notNull().default(false),
  rrule: text('rrule'),
  exdates: jsonb('exdates'),
  seriesUid: text('series_uid'),
  isMaster: boolean('is_master').notNull().default(false),
  status: text('status'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, t => [
  check('synced_events_status', sql`${t.status} is null or ${t.status} in ('confirmed', 'cancelled')`),
  index('synced_events_cal_start_idx').on(t.externalCalendarId, t.start),
  index('synced_events_cal_uid_idx').on(t.externalCalendarId, t.uid),
])
