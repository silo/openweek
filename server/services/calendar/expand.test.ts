import { describe, expect, it } from 'vitest'
import { expandIcs } from './expand'

// A Google-style feed: leading BOM + a VTIMEZONE + a TZID recurring event + an all-day event.
const ICS = `\uFEFFBEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar//EN
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:standup@example.com
DTSTART;TZID=America/New_York:20260706T090000
DTEND;TZID=America/New_York:20260706T093000
RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
SUMMARY:Standup
END:VEVENT
BEGIN:VEVENT
UID:allday@example.com
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260711
SUMMARY:All day thing
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n')

describe('expandIcs', () => {
  it('parses a BOM-prefixed Google-style feed and expands a TZID recurrence', () => {
    const start = new Date('2026-07-06T00:00:00Z')
    const end = new Date('2026-07-11T00:00:00Z')
    const events = expandIcs(ICS, start, end)

    const standups = events.filter(e => e.title === 'Standup')
    expect(standups.length).toBe(5) // Mon–Fri of that week
    expect(standups[0]!.allDay).toBe(false)

    const allDay = events.find(e => e.title === 'All day thing')
    expect(allDay?.allDay).toBe(true)
    expect(allDay?.dateOnly).toBe('2026-07-10')
  })

  it('throws a clear error for a non-iCal (e.g. HTML) response', () => {
    expect(() => expandIcs('<!DOCTYPE html><html>nope</html>', new Date(), new Date())).toThrow(/iCal feed/)
  })
})
