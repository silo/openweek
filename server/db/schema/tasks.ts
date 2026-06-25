import { sql } from 'drizzle-orm'
import { boolean, check, date, foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { boards } from './boards'
import { lists } from './lists'

/**
 * A task belongs to a board, and to EITHER a `date` OR a `listId` — never both,
 * never neither (enforced by a DB CHECK). `position` is a fractional index,
 * meaningful only within a single day-column or single list.
 *
 * `boardId` is NOT redundant: date-tasks have no list, so the board parent must
 * live on the task itself.
 *
 * `recurrenceRule` / `recurrenceId` / `parentId` are INERT in v1 — present so
 * recurrence/subtasks land later as a no-op migration over live, ordered data.
 */
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  notes: text('notes'),
  date: date('date'),
  listId: uuid('list_id'),
  position: text('position').notNull(),
  color: text('color'),
  done: boolean('done').notNull().default(false),
  rolledOverFrom: date('rolled_over_from'),
  // Inert in v1 (forward-compat columns).
  recurrenceRule: text('recurrence_rule'),
  recurrenceId: uuid('recurrence_id'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  // Exactly-one-of(date, list) — enforced in the DB so no code path can violate it.
  check('tasks_date_xor_list', sql`(${t.date} is not null) <> (${t.listId} is not null)`),
  // A task's list must belong to the task's board.
  foreignKey({
    columns: [t.listId, t.boardId],
    foreignColumns: [lists.id, lists.boardId],
    name: 'tasks_list_board_fk',
  }).onDelete('cascade'),
  // The two ordering scopes — always queried as (… , position, id).
  index('tasks_board_date_position_idx').on(t.boardId, t.date, t.position),
  index('tasks_list_position_idx').on(t.listId, t.position),
])
