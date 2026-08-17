import { requireUserId } from '../../../utils/session'
import { googleAuthUrl, isGoogleConfigured } from '../../../services/calendar/google'

export default defineEventHandler(async (event) => {
  await requireUserId(event)
  if (!isGoogleConfigured()) {
    throw createError({ statusCode: 400, statusMessage: 'Google is not configured (set GOOGLE_CLIENT_ID/SECRET)' })
  }
  return sendRedirect(event, googleAuthUrl())
})
