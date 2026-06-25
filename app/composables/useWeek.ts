import { addDays, addWeeks, format, isToday, startOfWeek } from 'date-fns'
import { computed } from 'vue'

export interface WeekDay {
  iso: string // yyyy-MM-dd — the key used as a task's `date`
  date: Date
  dayName: string // Mon, Tue, …
  dayNumber: string // 1–31
  monthLabel: string // Jun
  isToday: boolean
}

/**
 * Current week range + prev/next/this-week navigation. Week start follows the
 * signed-in user (default Monday). The week offset is shared app-wide via
 * useState, so the grid and the "move to…" menu always agree on which week is
 * displayed. Day columns are derived from dates — never stored.
 */
export function useWeek() {
  const user = useAuthUser()
  const weekStartsOn = computed(() => (user.value?.weekStartsOn ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6)

  // Offset in weeks from the current week (0 = this week) — shared across instances.
  const offset = useState('week-offset', () => 0)

  const anchor = computed(() => startOfWeek(addWeeks(new Date(), offset.value), { weekStartsOn: weekStartsOn.value }))

  const days = computed<WeekDay[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(anchor.value, i)
      return {
        iso: format(date, 'yyyy-MM-dd'),
        date,
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        monthLabel: format(date, 'MMM'),
        isToday: isToday(date),
      }
    }),
  )

  const rangeLabel = computed(() => {
    const first = days.value[0]!.date
    const last = days.value[6]!.date
    return `${format(first, 'MMM d')} – ${format(last, 'MMM d, yyyy')}`
  })

  const next = () => { offset.value += 1 }
  const prev = () => { offset.value -= 1 }
  const thisWeek = () => { offset.value = 0 }

  return { offset, days, rangeLabel, next, prev, thisWeek }
}
