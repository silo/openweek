import { eq } from 'drizzle-orm'
import { db } from '../database/client'
import { userSettings } from '../database/schema'
import { isPastDate, todayInTz, todayStr } from '~~/shared/utils/week'

/**
 * Today's calendar date for this user — their configured timezone, not the server's, so a
 * planner running on a UTC box does not go dark at 01:00 for someone in Berlin.
 */
export async function userToday(userId: string): Promise<string> {
  const [row] = await db.select({ timezone: userSettings.timezone })
    .from(userSettings).where(eq(userSettings.userId, userId))
  return row ? todayInTz(row.timezone) : todayStr()
}

/** The one message for the rule, so every endpoint rejects a past date the same way. */
export const PAST_DATE_MESSAGE = 'A task cannot be dated before today'

/** Guard for any endpoint that puts a task on a day. See `isPastDate`. */
export function assertNotPast(date: string, today: string): void {
  if (isPastDate(date, today)) {
    throw createError({ statusCode: 400, statusMessage: PAST_DATE_MESSAGE })
  }
}
