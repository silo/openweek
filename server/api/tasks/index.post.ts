import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { task } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { keyBetween } from '../../services/ordering'
import { taskCreateSchema } from '~~/shared/schemas/task'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = taskCreateSchema.parse(await readBody(event))

  // Append: position after the current last item in the bucket.
  const bucket = input.date ? eq(task.date, input.date) : eq(task.listId, input.listId!)
  const [last] = await db.select({ position: task.position }).from(task)
    .where(and(eq(task.userId, userId), bucket))
    .orderBy(desc(task.position)).limit(1)

  const [row] = await db.insert(task).values({
    userId,
    title: input.title,
    date: input.date ?? null,
    listId: input.listId ?? null,
    position: keyBetween(last?.position ?? null, null),
    note: input.note ?? null,
    highlightColor: input.highlightColor ?? null,
    timeOfDay: input.timeOfDay ?? null,
  }).returning()

  return row
})
