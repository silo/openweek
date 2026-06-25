import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { tasks } from '~~/server/db/schema'
import { loadOwnedTask } from '~~/server/utils/ownership'

// Delete a task the user owns.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const { db } = await loadOwnedTask(event, id)
  await db.delete(tasks).where(eq(tasks.id, id))
  return { ok: true }
})
