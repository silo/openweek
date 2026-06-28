import type { ParsedEvent } from './event-expansion'
import { calendar as googleCalendar } from '@googleapis/calendar'
import { eq } from 'drizzle-orm'
import { OAuth2Client } from 'google-auth-library'
import process from 'node:process'
import { createDAVClient } from 'tsdav'
import { useDb } from '../db'
import { connectedAccounts, externalCalendars, syncedEvents } from '../db/schema'
import { decrypt } from './crypto'
import { parseIcs } from './event-expansion'

type Account = typeof connectedAccounts.$inferSelect
type Calendar = typeof externalCalendars.$inferSelect

function secretOf(account: Account): string {
  if (!account.cipher || !account.iv || !account.authTag)
    return ''
  return decrypt({ cipher: account.cipher, iv: account.iv, authTag: account.authTag, encKeyVersion: account.encKeyVersion })
}

function googleClient(refreshToken: string) {
  const oauth = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })
  oauth.setCredentials({ refresh_token: refreshToken })
  // Cast around the dual google-auth-library copies (@googleapis bundles its own).
  return googleCalendar({ version: 'v3', auth: oauth as never })
}

// --- Calendar enumeration (at connect time) ---

export async function enumerateCalendars(account: Account): Promise<Array<{ externalId: string, name: string, color: string | null }>> {
  if (account.provider === 'ical')
    return [{ externalId: account.icalUrl ?? '', name: account.label, color: null }]

  if (account.provider === 'google') {
    const cal = googleClient(secretOf(account))
    const res = await cal.calendarList.list()
    return (res.data.items ?? []).map(c => ({ externalId: c.id ?? '', name: c.summary ?? c.id ?? 'Calendar', color: c.backgroundColor ?? null }))
  }

  // caldav
  const { username, password } = JSON.parse(secretOf(account)) as { username: string, password: string }
  const client = await createDAVClient({
    serverUrl: account.caldavUrl ?? '',
    credentials: { username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  const cals = await client.fetchCalendars()
  return cals.map(c => ({
    externalId: c.url,
    name: typeof c.displayName === 'string' ? c.displayName : 'Calendar',
    color: (c.calendarColor as string | undefined) ?? null,
  }))
}

// --- Event fetch per provider → ParsedEvent[] ---

async function fetchIcal(account: Account): Promise<ParsedEvent[]> {
  const url = secretOf(account) || account.icalUrl || ''
  const res = await fetch(url, { headers: { Accept: 'text/calendar' } })
  if (!res.ok)
    throw new Error(`iCal fetch ${res.status}`)
  return parseIcs(await res.text())
}

async function fetchCaldav(account: Account, cal: Calendar): Promise<ParsedEvent[]> {
  const { username, password } = JSON.parse(secretOf(account)) as { username: string, password: string }
  const client = await createDAVClient({
    serverUrl: account.caldavUrl ?? '',
    credentials: { username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  const objects = await client.fetchCalendarObjects({ calendar: { url: cal.externalCalendarId } })
  return objects.flatMap(o => (o.data ? parseIcs(o.data) : []))
}

async function fetchGoogle(account: Account, cal: Calendar): Promise<ParsedEvent[]> {
  const client = googleClient(secretOf(account))
  // Fetch masters (no singleEvents) over a generous window; expansion happens on read.
  const timeMin = new Date(Date.now() - 35 * 864e5).toISOString()
  const timeMax = new Date(Date.now() + 120 * 864e5).toISOString()
  const res = await client.events.list({ calendarId: cal.externalCalendarId, singleEvents: false, maxResults: 2500, timeMin, timeMax })
  return (res.data.items ?? []).map((e): ParsedEvent => {
    const allDay = !!e.start?.date
    const startStr = e.start?.dateTime ?? e.start?.date ?? null
    const rrule = (e.recurrence ?? []).find(r => r.startsWith('RRULE:'))?.slice(6) ?? null
    const exdates = (e.recurrence ?? [])
      .filter(r => r.startsWith('EXDATE'))
      .map(r => r.split(':')[1]?.slice(0, 8))
      .filter((v): v is string => !!v)
      .map(v => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`)
    return {
      uid: e.id ?? '',
      title: e.summary ?? '(no title)',
      start: startStr ? new Date(startStr) : null,
      end: e.end?.dateTime ?? e.end?.date ? new Date((e.end?.dateTime ?? e.end?.date)!) : null,
      startTz: e.start?.timeZone ?? null,
      allDay,
      rrule,
      exdates,
      recurrenceId: e.recurringEventId ?? null,
      status: e.status === 'cancelled' ? 'cancelled' : 'confirmed',
    }
  })
}

// --- Sync one calendar: full replace of its mirrored events ---

export async function syncCalendar(account: Account, cal: Calendar): Promise<void> {
  let events: ParsedEvent[]
  if (account.provider === 'ical')
    events = await fetchIcal(account)
  else if (account.provider === 'caldav')
    events = await fetchCaldav(account, cal)
  else
    events = await fetchGoogle(account, cal)

  const db = useDb()
  const now = new Date()
  await db.transaction(async (tx) => {
    await tx.delete(syncedEvents).where(eq(syncedEvents.externalCalendarId, cal.id))
    if (events.length > 0) {
      await tx.insert(syncedEvents).values(events.filter(e => e.start).map(e => ({
        externalCalendarId: cal.id,
        uid: e.uid,
        recurrenceId: e.recurrenceId,
        title: e.title,
        start: e.start,
        end: e.end,
        startTz: e.startTz,
        allDay: e.allDay,
        rrule: e.rrule,
        exdates: e.exdates,
        isMaster: !!e.rrule,
        status: e.status,
        lastSeenAt: now,
        updatedAt: now,
      })))
    }
    await tx.update(externalCalendars).set({ lastSyncedAt: now }).where(eq(externalCalendars.id, cal.id))
  })
  await db.update(connectedAccounts).set({ lastSyncedAt: now }).where(eq(connectedAccounts.id, account.id))
}

async function syncForAccounts(accounts: Account[]): Promise<number> {
  const db = useDb()
  let synced = 0
  for (const account of accounts) {
    const cals = await db.select().from(externalCalendars).where(eq(externalCalendars.connectedAccountId, account.id))
    for (const cal of cals) {
      if (!cal.enabled)
        continue
      try {
        await syncCalendar(account, cal)
        synced++
      }
      catch (err) {
        console.error(`[sync] calendar ${cal.id} failed:`, err)
      }
    }
  }
  return synced
}

/** Sync every connected account (the scheduled task). */
export async function syncAllAccounts(): Promise<number> {
  const accounts = await useDb().select().from(connectedAccounts)
  return syncForAccounts(accounts)
}

/** Sync one user's accounts ("Sync now"). */
export async function syncUserAccounts(userId: string): Promise<number> {
  const accounts = await useDb().select().from(connectedAccounts).where(eq(connectedAccounts.userId, userId))
  return syncForAccounts(accounts)
}
