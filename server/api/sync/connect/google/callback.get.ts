import { and, eq } from 'drizzle-orm'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import { uuidv7 } from 'uuidv7'
import { useDb } from '~~/server/db'
import { boards, connectedAccounts, externalCalendars } from '~~/server/db/schema'
import { encrypt } from '~~/server/utils/crypto'
import { getEnv } from '~~/server/utils/runtime-config'
import { requireUser } from '~~/server/utils/session'
import { enumerateCalendars } from '~~/server/utils/sync-engine'

const query = z.object({ code: z.string().min(1) })

// Exchange the OAuth code for a refresh token, store it encrypted, enumerate calendars.
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const { code } = await getValidatedQuery(event, query.parse)
  const env = getEnv()
  const db = useDb()

  const client = new OAuth2Client({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${env.BETTER_AUTH_URL}/api/sync/connect/google/callback`,
  })
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token)
    throw createError({ statusCode: 400, statusMessage: 'Google did not return a refresh token — remove app access and reconnect.' })

  const enc = encrypt(tokens.refresh_token)
  const accountId = uuidv7()
  const [account] = await db.insert(connectedAccounts).values({
    id: accountId,
    userId: session.user.id,
    provider: 'google',
    label: 'Google Calendar',
    cipher: enc.cipher,
    iv: enc.iv,
    authTag: enc.authTag,
    encKeyVersion: enc.encKeyVersion,
  }).returning()

  const [board] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.userId, session.user.id), eq(boards.isDefault, true)))
    .limit(1)

  try {
    const cals = await enumerateCalendars(account!)
    if (cals.length > 0) {
      await db.insert(externalCalendars).values(cals.map(c => ({
        connectedAccountId: accountId,
        externalCalendarId: c.externalId,
        name: c.name,
        color: c.color,
        // Default to the primary calendar enabled; others off to avoid noise.
        enabled: c.externalId === 'primary' || c.externalId.includes(session.user.email),
        boardId: board?.id ?? null,
      })))
    }
  }
  catch {
    // Keep the account even if enumeration hiccups; the poll will retry.
  }

  return sendRedirect(event, '/settings?calendar=connected')
})
