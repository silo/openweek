// Pure calendar-date helpers (YYYY-MM-DD strings, UTC arithmetic so there is no tz drift).
// Auto-imported across app and server.

export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!) + days * 86_400_000).toISOString().slice(0, 10)
}

export function eachDay(startStr: string, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => addDaysStr(startStr, i))
}

export function todayStr(): string {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Today's calendar date (YYYY-MM-DD) in the given IANA timezone. */
export function todayInTz(timezone: string): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }
  catch {
    return todayStr()
  }
}

/** Start-of-week for the date, given the user's week-start (0 = Sunday, 1 = Monday). */
export function startOfWeekStr(dateStr: string, weekStartsOn: 0 | 1): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
  const diff = (dow - weekStartsOn + 7) % 7
  return addDaysStr(dateStr, -diff)
}
