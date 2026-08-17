import { eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { userSettings } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { settingsUpdateSchema } from '~~/shared/schemas/settings'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const patch = settingsUpdateSchema.parse(await readBody(event))
  const [row] = await db
    .update(userSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))
    .returning()
  return row
})
