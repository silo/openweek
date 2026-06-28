import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { connectIcalInput } from '#shared/schemas/sync'
import { useDb } from '~~/server/db'
import { boards, connectedAccounts, externalCalendars } from '~~/server/db/schema'
import { encrypt } from '~~/server/utils/crypto'
import { requireUser } from '~~/server/utils/session'

// Connect an iCal feed: probe it, store the URL encrypted, register one calendar.
export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, connectIcalInput.parse)
  const session = await requireUser(event)
  const db = useDb()

  const res = await fetch(input.url, { headers: { Accept: 'text/calendar' } }).catch(() => null)
  if (!res || !res.ok)
    throw createError({ statusCode: 400, statusMessage: 'Could not fetch the iCal feed' })

  const [board] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.userId, session.user.id), eq(boards.isDefault, true)))
    .limit(1)

  const enc = encrypt(input.url)
  const accountId = uuidv7()
  await db.insert(connectedAccounts).values({
    id: accountId,
    userId: session.user.id,
    provider: 'ical',
    label: input.label,
    cipher: enc.cipher,
    iv: enc.iv,
    authTag: enc.authTag,
    encKeyVersion: enc.encKeyVersion,
    icalUrl: input.url,
  })
  await db.insert(externalCalendars).values({
    connectedAccountId: accountId,
    externalCalendarId: input.url,
    name: input.label,
    enabled: true,
    boardId: board?.id ?? null,
  })

  return { ok: true, id: accountId }
})
