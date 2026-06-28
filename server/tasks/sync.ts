import { syncAllAccounts } from '~~/server/utils/sync-engine'

/**
 * Scheduled calendar poll (every ~10 min). Incremental per provider; in-process
 * in the single app container. The heavy lifting lives in the sync engine so the
 * task stays a thin trigger. See docs/calendar-sync.md.
 */
export default defineTask({
  meta: { name: 'sync', description: 'Poll connected calendars and mirror events' },
  async run() {
    const count = await syncAllAccounts()
    return { result: `synced ${count} calendars` }
  },
})
