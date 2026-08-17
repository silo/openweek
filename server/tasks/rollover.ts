import { eq } from 'drizzle-orm'
import { db } from '../database/client'
import { userSettings } from '../database/schema'
import { rolloverForUser } from '../services/rollover'
import { todayInTz } from '~~/shared/utils/week'

// Backstop for users who don't open the app; the authoritative path is lazy-on-load in week.get.
export default defineTask({
  meta: { name: 'rollover', description: 'Roll unfinished past tasks forward to today for opted-in users' },
  async run() {
    const users = await db.select({ userId: userSettings.userId, timezone: userSettings.timezone })
      .from(userSettings).where(eq(userSettings.rolloverEnabled, true))
    let moved = 0
    for (const u of users) moved += await rolloverForUser(u.userId, todayInTz(u.timezone))
    return { result: { users: users.length, moved } }
  },
})
