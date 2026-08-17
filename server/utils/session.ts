import type { H3Event } from 'h3'
import { auth } from './auth'

/** Resolve the current session, or null. */
export async function getSessionUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  return session?.user ?? null
}

/** Resolve the current user id, or throw 401. Every app endpoint scopes by this. */
export async function requireUserId(event: H3Event): Promise<string> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user.id
}
