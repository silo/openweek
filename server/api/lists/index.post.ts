import { desc, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { list } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { keyBetween } from '../../services/ordering'
import { listCreateSchema } from '~~/shared/schemas/list'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = listCreateSchema.parse(await readBody(event))
  const [last] = await db.select({ position: list.position }).from(list)
    .where(eq(list.userId, userId)).orderBy(desc(list.position)).limit(1)
  const [row] = await db.insert(list).values({
    userId,
    name: input.name,
    color: input.color ?? '#C6C1B5',
    position: keyBetween(last?.position ?? null, null),
  }).returning()
  return row
})
