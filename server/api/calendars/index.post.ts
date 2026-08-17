import { db } from '../../database/client'
import { calendarConnection, calendarSource } from '../../database/schema'
import { requireUserId } from '../../utils/session'
import { encryptJson } from '../../utils/crypto'
import { caldavListCalendars } from '../../services/calendar/caldav'
import { syncConnection } from '../../services/calendar/sync'
import { connectSchema } from '~~/shared/schemas/calendar'
import { SOURCE_COLORS } from '~~/shared/constants/colors'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = connectSchema.parse(await readBody(event))

  if (input.provider === 'ical') {
    const enc = encryptJson({ url: input.url })
    const [conn] = await db.insert(calendarConnection).values({
      userId, provider: 'ical', displayName: input.displayName ?? 'iCal feed', color: SOURCE_COLORS.ical,
      encryptedCredentials: enc.ciphertext, iv: enc.iv, authTag: enc.authTag, encKeyVersion: enc.keyVersion,
    }).returning()
    await db.insert(calendarSource).values({
      connectionId: conn!.id, remoteId: input.url, name: input.displayName ?? 'iCal feed', color: SOURCE_COLORS.ical,
    })
    await syncConnection(conn!.id)
    return conn
  }

  // caldav — validate the credentials by listing calendars before storing them.
  const creds = { serverUrl: input.serverUrl, username: input.username, password: input.password }
  const calendars = await caldavListCalendars(creds)
  const enc = encryptJson(creds)
  const [conn] = await db.insert(calendarConnection).values({
    userId, provider: 'caldav', displayName: input.displayName ?? input.username, color: SOURCE_COLORS.caldav,
    encryptedCredentials: enc.ciphertext, iv: enc.iv, authTag: enc.authTag, encKeyVersion: enc.keyVersion,
  }).returning()
  if (calendars.length) {
    await db.insert(calendarSource).values(calendars.map(c => ({
      connectionId: conn!.id, remoteId: c.id, name: c.name, color: c.color || SOURCE_COLORS.caldav,
    })))
  }
  await syncConnection(conn!.id)
  return conn
})
