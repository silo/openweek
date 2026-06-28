import { sql } from 'drizzle-orm'
import { check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { user } from './auth'

/**
 * One credentialed external account (Google / CalDAV / iCal), independent of
 * login. The provider secret (refresh token / app-password / url) is stored
 * AES-256-GCM encrypted as base64 cipher/iv/authTag with an encKeyVersion for
 * key rotation. See docs/calendar-sync.md. SERVER ONLY.
 */
export const connectedAccounts = pgTable('connected_accounts', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  label: text('label').notNull(),
  cipher: text('cipher'),
  iv: text('iv'),
  authTag: text('auth_tag'),
  encKeyVersion: integer('enc_key_version').notNull().default(1),
  caldavUrl: text('caldav_url'),
  icalUrl: text('ical_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
}, t => [
  check('connected_accounts_provider', sql`${t.provider} in ('google', 'caldav', 'ical')`),
])
