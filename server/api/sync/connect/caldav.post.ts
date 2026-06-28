import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { connectCaldavInput } from '#shared/schemas/sync'
import { useDb } from '~~/server/db'
import { boards, connectedAccounts, externalCalendars } from '~~/server/db/schema'
import { encrypt } from '~~/server/utils/crypto'
import { enumerateCalendars } from '~~/server/utils/sync-engine'
import { requireUser } from '~~/server/utils/session'

// Connect a CalDAV account: encrypt {username,password}, enumerate calendars.
export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, connectCaldavInput.parse)
  const session = await requireUser(event)
  const db = useDb()

  const enc = encrypt(JSON.stringify({ username: input.username, password: input.password }))
  const accountId = uuidv7()
  const [account] = await db.insert(connectedAccounts).values({
    id: accountId,
    userId: session.user.id,
    provider: 'caldav',
    label: input.label,
    cipher: enc.cipher,
    iv: enc.iv,
    authTag: enc.authTag,
    encKeyVersion: enc.encKeyVersion,
    caldavUrl: input.serverUrl,
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
        enabled: true,
        boardId: board?.id ?? null,
      })))
    }
  }
  catch {
    await db.delete(connectedAccounts).where(eq(connectedAccounts.id, accountId))
    throw createError({ statusCode: 400, statusMessage: 'Could not reach the CalDAV server with those credentials' })
  }

  return { ok: true, id: accountId }
})
