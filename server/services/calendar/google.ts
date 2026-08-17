import { auth, calendar } from '@googleapis/calendar'
import type { GoogleCreds, ParsedEvent, RemoteCalendar } from './types'

// Use the OAuth2 client bundled with @googleapis/calendar so its types line up with calendar().
type GoogleClient = InstanceType<typeof auth.OAuth2>

export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function googleOAuthClient(): GoogleClient {
  return new auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.BETTER_AUTH_URL}/api/calendars/google/callback`,
  })
}

export function googleAuthUrl(): string {
  return googleOAuthClient().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: GOOGLE_SCOPES })
}

function authed(creds: GoogleCreds): GoogleClient {
  const client = googleOAuthClient()
  client.setCredentials({ access_token: creds.accessToken, refresh_token: creds.refreshToken, expiry_date: creds.expiryDate })
  return client
}

export async function googleExchangeCode(code: string): Promise<GoogleCreds> {
  const { tokens } = await googleOAuthClient().getToken(code)
  return {
    accessToken: tokens.access_token ?? '',
    refreshToken: tokens.refresh_token ?? '',
    expiryDate: tokens.expiry_date ?? 0,
    scope: tokens.scope,
  }
}

export async function googleListCalendars(creds: GoogleCreds): Promise<RemoteCalendar[]> {
  const cal = calendar({ version: 'v3', auth: authed(creds) })
  const res = await cal.calendarList.list()
  return (res.data.items ?? []).map(c => ({
    id: c.id ?? '',
    name: c.summaryOverride ?? c.summary ?? c.id ?? 'Calendar',
    color: c.backgroundColor ?? '#86B08B',
  }))
}

export async function googleFetchEvents(
  creds: GoogleCreds,
  calendarId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<{ events: ParsedEvent[], creds: GoogleCreds }> {
  const client = authed(creds)
  const cal = calendar({ version: 'v3', auth: client })
  const res = await cal.events.list({
    calendarId,
    timeMin: windowStart.toISOString(),
    timeMax: windowEnd.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 2500,
  })

  const events: ParsedEvent[] = (res.data.items ?? []).map((e) => {
    const allDay = Boolean(e.start?.date)
    const startStr = e.start?.dateTime ?? e.start?.date ?? new Date().toISOString()
    const endStr = e.end?.dateTime ?? e.end?.date ?? startStr
    return {
      uid: e.iCalUID ?? e.id ?? startStr,
      title: e.summary ?? '(untitled)',
      start: new Date(startStr),
      end: new Date(endStr),
      allDay,
      dateOnly: allDay ? (e.start?.date ?? null) : null,
      status: e.status === 'cancelled' ? 'cancelled' : 'confirmed',
    }
  })

  const c = client.credentials
  return {
    events,
    creds: {
      accessToken: c.access_token ?? creds.accessToken,
      refreshToken: c.refresh_token ?? creds.refreshToken,
      expiryDate: c.expiry_date ?? creds.expiryDate,
      scope: creds.scope,
    },
  }
}
