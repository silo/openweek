import { and, asc, desc, eq, isNotNull, isNull, lt } from 'drizzle-orm'
import { db } from '../database/client'
import { task } from '../database/schema'
import { keyBetween } from './ordering'

/**
 * Move a user's unfinished, past-dated tasks onto `today`, preserving the earliest
 * `originalDate` (shown as the ↪ marker). Idempotent: once moved, a task is dated
 * today and no longer overdue. Returns how many tasks moved.
 */
export async function rolloverForUser(userId: string, today: string): Promise<number> {
  const overdue = await db.select().from(task)
    .where(and(
      eq(task.userId, userId),
      isNotNull(task.date),
      lt(task.date, today),
      isNull(task.completedAt),
    ))
    .orderBy(asc(task.date), asc(task.position))

  if (!overdue.length) return 0

  const [last] = await db.select({ position: task.position }).from(task)
    .where(and(eq(task.userId, userId), eq(task.date, today)))
    .orderBy(desc(task.position)).limit(1)

  let prev = last?.position ?? null
  for (const t of overdue) {
    prev = keyBetween(prev, null)
    await db.update(task).set({
      date: today,
      position: prev,
      originalDate: t.originalDate ?? t.date,
      updatedAt: new Date(),
    }).where(eq(task.id, t.id))
  }
  return overdue.length
}
