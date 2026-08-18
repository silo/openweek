import { desc, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { list } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { keyBetween } from '../../services/ordering'
import { listCreateSchema } from '~~/shared/schemas/list'
import { inkForIndex } from '~~/shared/constants/colors'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = listCreateSchema.parse(await readBody(event))
  const [last] = await db.select({ position: list.position }).from(list)
    .where(eq(list.userId, userId)).orderBy(desc(list.position)).limit(1)
  // Without an explicit colour, cycle the palette so consecutive lists stay distinct.
  const count = await db.$count(list, eq(list.userId, userId))
  const [row] = await db.insert(list).values({
    userId,
    name: input.name,
    color: input.color ?? inkForIndex(count),
    position: keyBetween(last?.position ?? null, null),
  }).returning()
  return row
})
