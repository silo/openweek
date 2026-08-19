import { requireUserId } from '../../utils/session'
import { isGoogleConfigured } from '../../services/calendar/google'

/**
 * What this deployment can actually offer. Google needs OAuth credentials only the
 * self-hoster can supply, so Settings asks first rather than showing a button that 400s.
 *
 * The redirect URI is derived the same way `googleOAuthClient()` derives it, so what
 * Settings tells you to paste into the Cloud Console is what the server will send.
 */
export default defineEventHandler(async (event) => {
  await requireUserId(event)
  return {
    google: {
      configured: isGoogleConfigured(),
      redirectUri: `${process.env.BETTER_AUTH_URL ?? ''}/api/calendars/google/callback`,
    },
  }
})
