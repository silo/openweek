import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { boards } from './boards'
import { connectedAccounts } from './connected-accounts'

/**
 * A single calendar within a connected account. The user picks which to mirror
 * (`enabled`) and onto which board to display it (`boardId`, default board at
 * read time). syncToken/ctag are the incremental-sync cursors. SERVER ONLY.
 */
export const externalCalendars = pgTable('external_calendars', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  connectedAccountId: uuid('connected_account_id').notNull().references(() => connectedAccounts.id, { onDelete: 'cascade' }),
  externalCalendarId: text('external_calendar_id').notNull(),
  name: text('name'),
  color: text('color'),
  enabled: boolean('enabled').notNull().default(true),
  boardId: uuid('board_id').references(() => boards.id, { onDelete: 'set null' }),
  syncToken: text('sync_token'),
  ctag: text('ctag'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
}, t => [
  index('external_calendars_account_idx').on(t.connectedAccountId),
])
