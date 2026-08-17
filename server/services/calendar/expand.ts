import ICAL from 'ical.js'
import type { ParsedEvent } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

function makeParsed(ev: ICAL.Event, start: ICAL.Time, end: ICAL.Time | null, status: string): ParsedEvent {
  const allDay = start.isDate
  const endTime = end ?? start
  return {
    uid: ev.uid,
    title: ev.summary || '(untitled)',
    start: start.toJSDate(),
    end: endTime.toJSDate(),
    allDay,
    dateOnly: allDay ? `${start.year}-${pad(start.month)}-${pad(start.day)}` : null,
    status: status.toUpperCase() === 'CANCELLED' ? 'cancelled' : 'confirmed',
  }
}

/**
 * Expand an ICS document into concrete occurrences within [windowStart, windowEnd],
 * honouring RRULE/EXDATE/RDATE and RECURRENCE-ID overrides (via ical.js).
 */
export function expandIcs(ics: string, windowStart: Date, windowEnd: Date): ParsedEvent[] {
  const comp = new ICAL.Component(ICAL.parse(ics))
  const vevents = comp.getAllSubcomponents('vevent')

  const masters = new Map<string, ICAL.Event>()
  const exceptions: ICAL.Event[] = []
  for (const ve of vevents) {
    const ev = new ICAL.Event(ve)
    if (ev.isRecurrenceException()) exceptions.push(ev)
    else if (ev.uid) masters.set(ev.uid, ev)
  }
  for (const ex of exceptions) masters.get(ex.uid)?.relateException(ex)

  const out: ParsedEvent[] = []
  for (const ev of masters.values()) {
    const status = String(ev.component.getFirstPropertyValue('status') ?? 'CONFIRMED')
    if (ev.isRecurring()) {
      const it = ev.iterator()
      let guard = 0
      for (let next = it.next(); next && guard < 2000; next = it.next()) {
        guard++
        if (next.toJSDate() > windowEnd) break
        const det = ev.getOccurrenceDetails(next)
        if (det.endDate.toJSDate() < windowStart) continue
        out.push(makeParsed(ev, det.startDate, det.endDate, status))
      }
    }
    else if (ev.startDate) {
      const s = ev.startDate.toJSDate()
      const e = (ev.endDate ?? ev.startDate).toJSDate()
      if (e >= windowStart && s <= windowEnd) {
        out.push(makeParsed(ev, ev.startDate, ev.endDate, status))
      }
    }
  }
  return out
}
