import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { user } from './auth'

// --- shared column helpers -------------------------------------------------
const primaryId = () => uuid('id').primaryKey().$defaultFn(() => uuidv7())
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}
const userId = () => text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })

// --- enums -----------------------------------------------------------------
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system'])
export const fontStyleEnum = pgEnum('font_style', ['plex-mono', 'editorial', 'grotesk', 'typewriter'])
export const tagStyleEnum = pgEnum('tag_style', ['underline', 'swipe'])
export const highlightColorEnum = pgEnum('highlight_color', ['butter', 'mint', 'sky', 'rose'])
export const calendarProviderEnum = pgEnum('calendar_provider', ['google', 'caldav', 'ical'])
export const calendarConnectionStatusEnum = pgEnum('calendar_connection_status', ['active', 'error', 'reauth_required'])
export const calendarEventStatusEnum = pgEnum('calendar_event_status', ['confirmed', 'cancelled'])

// --- user settings (1:1 user) ----------------------------------------------
export const userSettings = pgTable('user_settings', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  weekStartsOn: smallint('week_starts_on').notNull().default(1),
  theme: themeEnum('theme').notNull().default('system'),
  accentColor: text('accent_color').notNull().default('#CBDDE9'),
  fontStyle: fontStyleEnum('font_style').notNull().default('plex-mono'),
  tagStyle: tagStyleEnum('tag_style').notNull().default('underline'),
  showCalendarEvents: boolean('show_calendar_events').notNull().default(true),
  rolloverEnabled: boolean('rollover_enabled').notNull().default(false),
  timezone: text('timezone').notNull().default('UTC'),
  ...timestamps,
})

// --- lists (the non-day buckets) -------------------------------------------
export const list = pgTable('list', {
  id: primaryId(),
  userId: userId(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#C6C1B5'),
  isDefault: boolean('is_default').notNull().default(false),
  position: text('position').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
}, t => [index('list_user_idx').on(t.userId)])

// --- calendar connections / sources / events -------------------------------
export const calendarConnection = pgTable('calendar_connection', {
  id: primaryId(),
  userId: userId(),
  provider: calendarProviderEnum('provider').notNull(),
  displayName: text('display_name').notNull(),
  color: text('color').notNull(),
  // AES-256-GCM: base64 ciphertext + iv + auth tag, plus the key version used.
  encryptedCredentials: text('encrypted_credentials').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  encKeyVersion: integer('enc_key_version').notNull().default(1),
  status: calendarConnectionStatusEnum('status').notNull().default('active'),
  lastError: text('last_error'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  ...timestamps,
}, t => [index('calendar_connection_user_idx').on(t.userId)])

export const calendarSource = pgTable('calendar_source', {
  id: primaryId(),
  connectionId: uuid('connection_id').notNull().references(() => calendarConnection.id, { onDelete: 'cascade' }),
  remoteId: text('remote_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  // incremental cursors: google syncToken / caldav ctag+etag / ical http validators
  syncToken: text('sync_token'),
  ctag: text('ctag'),
  etag: text('etag'),
  httpEtag: text('http_etag'),
  lastModified: text('last_modified'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  ...timestamps,
}, t => [index('calendar_source_connection_idx').on(t.connectionId)])

export const calendarEvent = pgTable('calendar_event', {
  id: primaryId(),
  userId: userId(),
  sourceId: uuid('source_id').notNull().references(() => calendarSource.id, { onDelete: 'cascade' }),
  remoteUid: text('remote_uid').notNull(),
  title: text('title').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  allDay: boolean('all_day').notNull().default(false),
  localDate: date('local_date', { mode: 'string' }).notNull(),
  timeLabel: text('time_label'),
  status: calendarEventStatusEnum('status').notNull().default('confirmed'),
  ...timestamps,
}, t => [
  uniqueIndex('calendar_event_dedupe_idx').on(t.sourceId, t.remoteUid, t.startAt),
  index('calendar_event_user_date_idx').on(t.userId, t.localDate),
])

// --- tasks (a task is on a day XOR in a list) ------------------------------
export const task = pgTable('task', {
  id: primaryId(),
  userId: userId(),
  date: date('date', { mode: 'string' }),
  listId: uuid('list_id').references(() => list.id, { onDelete: 'cascade' }),
  position: text('position').notNull(),
  title: text('title').notNull(),
  note: text('note'),
  highlightColor: highlightColorEnum('highlight_color'),
  timeOfDay: time('time_of_day'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  originalDate: date('original_date', { mode: 'string' }),
  recurrenceRule: text('recurrence_rule'),
  sourceEventId: uuid('source_event_id').references(() => calendarEvent.id, { onDelete: 'set null' }),
  sourceLabel: text('source_label'),
  ...timestamps,
}, t => [
  index('task_user_date_idx').on(t.userId, t.date),
  index('task_user_list_idx').on(t.userId, t.listId),
  index('task_user_completed_idx').on(t.userId, t.completedAt),
  check('task_bucket_ck', sql`num_nonnulls(${t.date}, ${t.listId}) = 1`),
])

// --- subtasks (schema-ready; UI deferred) ----------------------------------
export const subtask = pgTable('subtask', {
  id: primaryId(),
  taskId: uuid('task_id').notNull().references(() => task.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: text('position').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
}, t => [index('subtask_task_idx').on(t.taskId)])
