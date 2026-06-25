import { asc, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { boards } from '~~/server/db/schema'
import { requireUser } from '~~/server/utils/session'

// The signed-in user's boards (default first by position).
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const db = useDb()
  return db
    .select()
    .from(boards)
    .where(eq(boards.userId, session.user.id))
    .orderBy(asc(boards.position), asc(boards.id))
})
