import type { StatsRange, StatsScope } from '~~/shared/schemas/stats'
import { statsForUser } from '../services/stats'
import { requireUserId } from '../utils/session'
import { STATS_RANGES, STATS_SCOPES } from '~~/shared/schemas/stats'

/**
 * Read-only aggregates over the account's own tasks. Nothing here is stored or cached — the
 * numbers are derived on request from `task`, which is what keeps the feature migration-free.
 *
 * `scope=summary` returns just the headline block, for the strip above the week grid; the
 * Stats page asks for the whole thing.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const q = getQuery(event)

  const range = typeof q.range === 'string' && (STATS_RANGES as readonly string[]).includes(q.range)
    ? q.range as StatsRange
    : '4w'
  const scope = typeof q.scope === 'string' && (STATS_SCOPES as readonly string[]).includes(q.scope)
    ? q.scope as StatsScope
    : 'full'

  return statsForUser(userId, { range, scope })
})
