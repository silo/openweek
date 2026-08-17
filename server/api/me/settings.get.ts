import { eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { userSettings } from '../../database/schema'
import { requireUserId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  return row ?? null
})
