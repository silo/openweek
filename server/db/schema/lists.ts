import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { boards } from './boards'

/**
 * "Someday" / custom columns inside a board. Day columns are derived from
 * dates, not stored. The UNIQUE (id, board_id) backs the composite FK from
 * `tasks` (a task's list must belong to the task's board).
 */
export const lists = pgTable('lists', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  position: text('position').notNull(),
}, t => [
  unique('lists_id_board_id_unique').on(t.id, t.boardId),
])
