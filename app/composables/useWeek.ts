import { addDays, addWeeks, format, isToday, startOfWeek } from 'date-fns'
import { computed, ref } from 'vue'

export interface WeekDay {
  iso: string // yyyy-MM-dd — the key used as a task's `date`
  date: Date
  dayName: string // Mon, Tue, …
  dayNumber: string // 1–31
  monthLabel: string // Jun
  isToday: boolean
}

/**
 * Current week range + prev/next/this-week navigation. Week start is per-user
 * (default Monday); wired to the user setting in Phase 2/3. Day columns are
 * derived from dates here — never stored. See docs/data-model.md.
 */
export function useWeek(weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1) {
  // Offset in weeks from the current week (0 = this week).
  const offset = ref(0)

  const anchor = computed(() => startOfWeek(addWeeks(new Date(), offset.value), { weekStartsOn }))

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
