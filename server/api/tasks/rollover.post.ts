import { and, eq, inArray, isNull, lt, sql } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { boards, tasks, user } from '~~/server/db/schema'
import { localDay, shouldRollover } from '~~/server/utils/rollover'
import { requireUser } from '~~/server/utils/session'

/**
 * Roll unfinished past tasks forward to the user's local "today".
 *
 * Opt-in (user.rolloverEnabled) and idempotent per-user per-local-day
 * (guarded by user.lastRolloverDate + a per-user advisory lock). Mutates `date`
 * to today but records `rolledOverFrom` (earliest original, reversible) and
 * skips recurring instances (recurrenceId IS NULL). Never an SSR side-effect —
 * the client POSTs this explicitly on load/focus.
 */
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const db = useDb()
  const userId = session.user.id

  const [u] = await db
    .select({ timezone: user.timezone, enabled: user.rolloverEnabled, last: user.lastRolloverDate })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!u || !u.enabled)
    return { rolled: 0, enabled: false }

  const today = localDay(new Date(), u.timezone)
  if (!shouldRollover({ enabled: u.enabled, lastRolloverDate: u.last, today }))
    return { rolled: 0, date: today, alreadyRolled: true }

  const rolled = await db.transaction(async (tx) => {
    // Serialize per user so SSR + hydration (or two tabs) can't double-fire.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)

    const [again] = await tx
      .select({ last: user.lastRolloverDate })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
    if (again?.last === today)
      return 0

    const ownedBoards = tx.select({ id: boards.id }).from(boards).where(eq(boards.userId, userId))

    const updated = await tx
      .update(tasks)
      .set({
        date: today,
        rolledOverFrom: sql`coalesce(${tasks.rolledOverFrom}, ${tasks.date})`,
        updatedAt: new Date(),
      })
      .where(and(
        inArray(tasks.boardId, ownedBoards),
        lt(tasks.date, today),
        eq(tasks.done, false),
        // Skip generated instances AND recurrence templates AND subtasks.
        isNull(tasks.recurrenceId),
        isNull(tasks.recurrenceRule),
        isNull(tasks.parentId),
      ))
      .returning({ id: tasks.id })

    await tx.update(user).set({ lastRolloverDate: today }).where(eq(user.id, userId))
    return updated.length
  })

  return { rolled, date: today }
})
