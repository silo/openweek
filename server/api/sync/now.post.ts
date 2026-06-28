import { requireUser } from '~~/server/utils/session'
import { syncUserAccounts } from '~~/server/utils/sync-engine'

// "Sync now" — manually poll the signed-in user's connected accounts.
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const synced = await syncUserAccounts(session.user.id)
  return { synced }
})
