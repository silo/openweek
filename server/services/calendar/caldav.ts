import { DAVClient } from 'tsdav'
import type { CalDavCreds, ParsedEvent, RemoteCalendar } from './types'
import { expandIcs } from './expand'

async function connect(creds: CalDavCreds): Promise<DAVClient> {
  const client = new DAVClient({
    serverUrl: creds.serverUrl,
    credentials: { username: creds.username, password: creds.password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  await client.login()
  return client
}

export async function caldavListCalendars(creds: CalDavCreds): Promise<RemoteCalendar[]> {
  const client = await connect(creds)
  const calendars = await client.fetchCalendars()
  return calendars.map(cal => ({
    id: String(cal.url),
    name: typeof cal.displayName === 'string' ? cal.displayName : String(cal.url),
    color: typeof cal.calendarColor === 'string' ? cal.calendarColor : '#9CBBD6',
  }))
}

export async function caldavFetchEvents(
  creds: CalDavCreds,
  calendarUrl: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<ParsedEvent[]> {
  const client = await connect(creds)
  const calendars = await client.fetchCalendars()
  const cal = calendars.find(c => String(c.url) === calendarUrl)
  if (!cal) return []

  const objects = await client.fetchCalendarObjects({
    calendar: cal,
    timeRange: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
  })

  const out: ParsedEvent[] = []
  for (const obj of objects) {
    if (typeof obj.data === 'string' && obj.data.includes('BEGIN:VEVENT')) {
      out.push(...expandIcs(obj.data, windowStart, windowEnd))
    }
  }
  return out
}
