// Pure incremental-sync cursor logic — provider-agnostic decisions, kept out of
// the network glue so they're unit-testable. See docs/calendar-sync.md.

export type SyncMode = 'incremental' | 'full'

/** Decide the next fetch mode given the stored cursor. No cursor ⇒ full resync. */
export function nextSyncMode(cursor: string | null | undefined): SyncMode {
  return cursor ? 'incremental' : 'full'
}

/**
 * On a provider error, decide whether to discard the cursor and do a windowed
 * full resync. Google returns HTTP 410 Gone for an expired syncToken; CalDAV
 * returns an invalid-token / 412 for a stale sync-collection token.
 */
export function shouldResyncOnError(status: number | null | undefined, message?: string): boolean {
  if (status === 410 || status === 412)
    return true
  const m = (message ?? '').toLowerCase()
  return m.includes('sync token') || m.includes('synctoken') || m.includes('invalid token')
}
