import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { calendarConnection, calendarSource, userSettings } from '../../database/schema'
import { decryptJson, encryptJson } from '../../utils/crypto'
import type { CalDavCreds, GoogleCreds, IcalCreds } from './types'
import { expandIcs } from './expand'
import { fetchIcal } from './ical'
import { caldavFetchEvents } from './caldav'
import { googleFetchEvents } from './google'
import { storeEvents } from './store'

const DAY = 86_400_000
function syncWindow() {
  const now = Date.now()
  return { start: new Date(now - 7 * DAY), end: new Date(now + 42 * DAY) }
}

async function userTz(userId: string): Promise<string> {
  const [s] = await db.select({ timezone: userSettings.timezone }).from(userSettings).where(eq(userSettings.userId, userId))
  return s?.timezone ?? 'UTC'
}

/** Sync one connection: decrypt creds, fetch + expand + cache each enabled source. */
export async function syncConnection(connectionId: string): Promise<void> {
  const [conn] = await db.select().from(calendarConnection).where(eq(calendarConnection.id, connectionId))
  if (!conn) return

  const sources = await db.select().from(calendarSource)
    .where(and(eq(calendarSource.connectionId, connectionId), eq(calendarSource.enabled, true)))
  const w = syncWindow()

  try {
    const creds = decryptJson<GoogleCreds & CalDavCreds & IcalCreds>({
      ciphertext: conn.encryptedCredentials, iv: conn.iv, authTag: conn.authTag, keyVersion: conn.encKeyVersion,
    })
    const tz = await userTz(conn.userId)

    for (const src of sources) {
      if (conn.provider === 'ical') {
        const res = await fetchIcal(creds.url, src.httpEtag ?? undefined, src.lastModified ?? undefined)
        if (res.status === 'ok' && res.ics) {
          await storeEvents(conn.userId, src.id, tz, expandIcs(res.ics, w.start, w.end), w.start, w.end)
          await db.update(calendarSource).set({ httpEtag: res.etag, lastModified: res.lastModified, lastSyncedAt: new Date() }).where(eq(calendarSource.id, src.id))
        }
      }
      else if (conn.provider === 'caldav') {
        const events = await caldavFetchEvents(creds, src.remoteId, w.start, w.end)
        await storeEvents(conn.userId, src.id, tz, events, w.start, w.end)
        await db.update(calendarSource).set({ lastSyncedAt: new Date() }).where(eq(calendarSource.id, src.id))
      }
      else if (conn.provider === 'google') {
        const { events, creds: refreshed } = await googleFetchEvents(creds, src.remoteId, w.start, w.end)
        await storeEvents(conn.userId, src.id, tz, events, w.start, w.end)
        await db.update(calendarSource).set({ lastSyncedAt: new Date() }).where(eq(calendarSource.id, src.id))
        const enc = encryptJson(refreshed, conn.encKeyVersion)
        await db.update(calendarConnection).set({ encryptedCredentials: enc.ciphertext, iv: enc.iv, authTag: enc.authTag }).where(eq(calendarConnection.id, conn.id))
      }
    }

    await db.update(calendarConnection).set({ status: 'active', lastError: null, lastSyncedAt: new Date() }).where(eq(calendarConnection.id, conn.id))
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.update(calendarConnection).set({ status: 'error', lastError: message }).where(eq(calendarConnection.id, conn.id))
  }
}

export async function syncUser(userId: string): Promise<void> {
  const conns = await db.select({ id: calendarConnection.id }).from(calendarConnection).where(eq(calendarConnection.userId, userId))
  for (const c of conns) await syncConnection(c.id)
}

export async function syncAll(): Promise<void> {
  const conns = await db.select({ id: calendarConnection.id }).from(calendarConnection)
  for (const c of conns) await syncConnection(c.id)
}
