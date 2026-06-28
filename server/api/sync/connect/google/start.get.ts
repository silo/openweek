import { OAuth2Client } from 'google-auth-library'
import { getEnv } from '~~/server/utils/runtime-config'
import { requireUser } from '~~/server/utils/session'

// Dedicated Google Calendar OAuth (separate from login). Read-only + offline so
// we get a refresh token (prompt=consent forces it — the documented footgun).
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const env = getEnv()
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
    throw createError({ statusCode: 400, statusMessage: 'Google is not configured on this instance' })

  const client = new OAuth2Client({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${env.BETTER_AUTH_URL}/api/sync/connect/google/callback`,
  })
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
  })
  return sendRedirect(event, url)
})
