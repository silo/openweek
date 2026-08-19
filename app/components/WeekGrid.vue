<script setup lang="ts">
import { isWeekend, parseISO } from 'date-fns'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { todayStr } from '~~/shared/utils/week'

const emit = defineEmits<{ openTask: [Task, DOMRect], convert: [CalendarEventDto] }>()

const week = useWeekStore()
const settings = useSettingsStore()
const cals = useCalendarsStore()

const today = todayStr()

/**
 * Cached per date rather than filtered in the binding: a fresh array on every render gives
 * all seven DayColumns new props, so focusing a day re-rendered every task row for nothing.
 */
const eventsByDate = computed(() =>
  new Map(week.days.map(d => [d.date, cals.visibleEvents(d.events)])),
)

const visibleDays = computed(() =>
  settings.settings?.showWeekends === false
    ? week.days.filter(d => !isWeekend(parseISO(d.date)))
    : week.days,
)

/**
 * Focusing a day widens its column and narrows the rest, rather than hiding anything.
 * Ratios are the design's: 2.1fr against 0.85fr.
 *
 * Always an expanded track list, never `repeat()`: the two notations do not interpolate,
 * so mixing them made every transition into or out of the unfocused state snap instead of
 * animate. Only focus-to-focus moves were animating.
 */
const colTemplate = computed(() => {
  const days = visibleDays.value
  const focused = days.findIndex(d => d.date === week.focusDate)
  return days
    .map((_, i) => {
      if (focused < 0) return 'minmax(0,1fr)'
      return i === focused ? 'minmax(0,2.1fr)' : 'minmax(0,0.85fr)'
    })
    .join(' ')
})
</script>

<template>
  <div class="relative overflow-auto">
    <WeekSkeleton v-if="week.loading && !week.days.length" :columns="visibleDays.length || 7" />

    <div
      v-else
      class="grid min-h-full gap-px bg-ow-line transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none"
      :style="{ gridTemplateColumns: colTemplate }"
    >
      <DayColumn
        v-for="d in visibleDays"
        :key="d.date"
        :date="d.date"
        :tasks="d.tasks"
        :events="eventsByDate.get(d.date) ?? []"
        :is-today="d.date === today"
        :is-weekend="isWeekend(parseISO(d.date))"
        @open-task="(t, r) => emit('openTask', t, r)"
        @convert="emit('convert', $event)"
      />
    </div>

    <!-- Floated over the grid rather than stacked above it: as a block it pushed the whole
         week down whenever you paged onto an empty one. -->
    <p
      v-if="week.weekEmpty && !week.loading"
      class="pointer-events-none absolute inset-x-0 top-[38%] text-center text-[13.5px] text-ow-ghost"
    >
      A clear week — add a task on any day, or drag one up from a list below.
    </p>
  </div>
</template>
