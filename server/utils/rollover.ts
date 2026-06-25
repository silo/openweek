import { formatInTimeZone } from 'date-fns-tz'

/** The user's local calendar day (yyyy-MM-dd) for "today"/rollover decisions. */
export function localDay(now: Date, timezone: string | null): string {
  return formatInTimeZone(now, timezone || 'UTC', 'yyyy-MM-dd')
}

/**
 * Whether rollover should run: only when opted in and not already run today
 * (idempotent per local day). The DB advisory lock guards the race; this is the
 * cheap pre-check and the unit-testable decision.
 */
export function shouldRollover(opts: {
  enabled: boolean
  lastRolloverDate: string | null
  today: string
}): boolean {
  return opts.enabled && opts.lastRolloverDate !== opts.today
}
