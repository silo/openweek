import { describe, expect, it } from 'vitest'
import { expandMaster, parseIcs } from './event-expansion'

const ICS_RECUR = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//EN
BEGIN:VEVENT
UID:standup-1
SUMMARY:Standup
DTSTART:20260622T090000Z
DTEND:20260622T091500Z
RRULE:FREQ=WEEKLY;BYDAY=MO
EXDATE:20260629T090000Z
END:VEVENT
END:VCALENDAR`

const ICS_SINGLE = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:lunch-1
SUMMARY:Lunch
DTSTART:20260624T123000Z
DTEND:20260624T133000Z
END:VEVENT
END:VCALENDAR`

describe('parseIcs', () => {
  it('parses a recurring master with rrule + exdate', () => {
    const [ev] = parseIcs(ICS_RECUR)
    expect(ev!.title).toBe('Standup')
    expect(ev!.rrule).toContain('FREQ=WEEKLY')
    expect(ev!.exdates).toContain('2026-06-29')
  })
  it('parses a single event', () => {
    const [ev] = parseIcs(ICS_SINGLE)
    expect(ev!.rrule).toBeNull()
    expect(ev!.title).toBe('Lunch')
  })
})

describe('expandMaster', () => {
  it('expands a weekly series across a window, honoring EXDATE', () => {
    const [ev] = parseIcs(ICS_RECUR)
    const occ = expandMaster(
      { start: ev!.start!, allDay: ev!.allDay, rrule: ev!.rrule, exdates: ev!.exdates },
      '2026-06-22',
      '2026-07-13',
    )
    const dates = occ.map(o => o.date)
    expect(dates).toContain('2026-06-22')
    expect(dates).not.toContain('2026-06-29') // excluded
    expect(dates).toContain('2026-07-06')
    expect(dates).toContain('2026-07-13')
  })

  it('yields a single occurrence for a non-recurring event in window', () => {
    const [ev] = parseIcs(ICS_SINGLE)
    const occ = expandMaster(
      { start: ev!.start!, allDay: ev!.allDay, rrule: ev!.rrule, exdates: ev!.exdates },
      '2026-06-22',
      '2026-06-28',
    )
    expect(occ.map(o => o.date)).toEqual(['2026-06-24'])
  })

  it('returns nothing when the single event is outside the window', () => {
    const [ev] = parseIcs(ICS_SINGLE)
    const occ = expandMaster(
      { start: ev!.start!, allDay: ev!.allDay, rrule: ev!.rrule, exdates: ev!.exdates },
      '2026-07-01',
      '2026-07-07',
    )
    expect(occ).toHaveLength(0)
  })
})
