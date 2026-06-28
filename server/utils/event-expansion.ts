import ICAL from 'ical.js'

// Parse external calendar data and expand recurring series for a visible window.
// We store series masters and expand on read (see docs/calendar-sync.md).

export interface ParsedEvent {
  uid: string
  title: string
  start: Date | null
  end: Date | null
  startTz: string | null
  allDay: boolean
  rrule: string | null
  exdates: string[] // yyyy-MM-dd of cancelled occurrences
  recurrenceId: string | null
  status: 'confirmed' | 'cancelled'
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse an ICS string into events (masters + overrides + singles). */
export function parseIcs(ics: string): ParsedEvent[] {
  const comp = new ICAL.Component(ICAL.parse(ics))
  const out: ParsedEvent[] = []
  for (const ve of comp.getAllSubcomponents('vevent')) {
    const event = new ICAL.Event(ve)
    const rruleProp = ve.getFirstPropertyValue('rrule')
    const exdateProps = ve.getAllProperties('exdate')
    const exdates: string[] = []
    for (const ex of exdateProps) {
      const v = ex.getFirstValue() as ICAL.Time | undefined
      if (v)
        exdates.push(ymd(v.toJSDate()))
    }
    const recurrenceId = ve.getFirstPropertyValue('recurrence-id')
    const status = String(ve.getFirstPropertyValue('status') ?? '').toUpperCase() === 'CANCELLED' ? 'cancelled' : 'confirmed'
    out.push({
      uid: event.uid ?? '',
      title: event.summary ?? '(no title)',
      start: event.startDate ? event.startDate.toJSDate() : null,
      end: event.endDate ? event.endDate.toJSDate() : null,
      startTz: event.startDate?.zone?.tzid ?? null,
      allDay: event.startDate ? event.startDate.isDate : false,
      rrule: rruleProp ? String(rruleProp) : null,
      exdates,
      recurrenceId: recurrenceId ? String(recurrenceId) : null,
      status,
    })
  }
  return out
}

export interface Occurrence {
  date: string // yyyy-MM-dd
  startTime: string | null // HH:mm, null for all-day
  allDay: boolean
}

/**
 * Expand a stored master into occurrence dates within [from, to] (inclusive),
 * honoring RRULE + EXDATE. Non-recurring events yield at most one occurrence.
 */
export function expandMaster(
  master: { start: Date, allDay: boolean, rrule: string | null, exdates: string[] },
  from: string,
  to: string,
): Occurrence[] {
  const fromT = new Date(`${from}T00:00:00`)
  const toT = new Date(`${to}T23:59:59`)
  const exset = new Set(master.exdates)

  const timeOf = (d: Date): string | null => (master.allDay ? null : `${pad(d.getHours())}:${pad(d.getMinutes())}`)

  if (!master.rrule) {
    if (master.start >= fromT && master.start <= toT && !exset.has(ymd(master.start)))
      return [{ date: ymd(master.start), startTime: timeOf(master.start), allDay: master.allDay }]
    return []
  }

  const dtstart = ICAL.Time.fromJSDate(master.start, false)
  const recur = ICAL.Recur.fromString(master.rrule)
  const iter = recur.iterator(dtstart)
  const out: Occurrence[] = []
  let next: ICAL.Time | null
  let guard = 0
   
  while ((next = iter.next()) && guard++ < 1000) {
    const jd = next.toJSDate()
    if (jd > toT)
      break
    if (jd < fromT)
      continue
    const day = ymd(jd)
    if (exset.has(day))
      continue
    out.push({ date: day, startTime: timeOf(jd), allDay: master.allDay })
  }
  return out
}
