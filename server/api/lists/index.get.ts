import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '../../database/client'
import { list } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { ensureDefaultList } from '../../services/lists'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  await ensureDefaultList(userId)
  return db.select().from(list)
    .where(and(eq(list.userId, userId), isNull(list.archivedAt)))
    .orderBy(asc(list.position), asc(list.id))
})
