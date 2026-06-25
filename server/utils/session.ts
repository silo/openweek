import type { H3Event } from 'h3'
import { serverAuth } from './auth'

/** Resolve the current session from request cookies, or null. */
export async function getAuthSession(event: H3Event) {
  return serverAuth().api.getSession({ headers: event.headers })
}

/** Require an authenticated user, else 401. Returns the session. */
export async function requireUser(event: H3Event) {
  const session = await getAuthSession(event)
  if (!session)
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  return session
}

/** Require an admin user, else 401/403. Returns the session. */
export async function requireAdmin(event: H3Event) {
  const session = await requireUser(event)
  if (session.user.role !== 'admin')
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  return session
}
