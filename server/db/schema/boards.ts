import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

/**
 * The user's planner container. Named `boards` (not `calendars`) so the word
 * "calendar" stays reserved for external Google/CalDAV/iCal sources.
 * A user has one or more; new users get one default board.
 *
 * `userId` is a plain text column for now — the FK to Better Auth's `user`
 * table (cascade delete) is added in Phase 2 once the auth tables exist.
 */
export const boards = pgTable('boards', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  color: text('color'),
  position: text('position').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
