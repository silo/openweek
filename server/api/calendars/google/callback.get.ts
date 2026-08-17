import { db } from '../../../database/client'
import { calendarConnection, calendarSource } from '../../../database/schema'
import { requireUserId } from '../../../utils/session'
import { encryptJson } from '../../../utils/crypto'
import { googleExchangeCode, googleListCalendars, isGoogleConfigured } from '../../../services/calendar/google'
import { syncConnection } from '../../../services/calendar/sync'
import { SOURCE_COLORS } from '~~/shared/constants/colors'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const code = getQuery(event).code
  if (!isGoogleConfigured() || typeof code !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing authorization code' })
  }

  const creds = await googleExchangeCode(code)
  const calendars = await googleListCalendars(creds)
  const enc = encryptJson(creds)
  const [conn] = await db.insert(calendarConnection).values({
    userId, provider: 'google', displayName: 'Google Calendar', color: SOURCE_COLORS.google,
    encryptedCredentials: enc.ciphertext, iv: enc.iv, authTag: enc.authTag, encKeyVersion: enc.keyVersion,
  }).returning()
  if (calendars.length) {
    await db.insert(calendarSource).values(calendars.map(c => ({
      connectionId: conn!.id, remoteId: c.id, name: c.name, color: c.color || SOURCE_COLORS.google,
    })))
  }
  await syncConnection(conn!.id)
  return sendRedirect(event, '/settings')
})
