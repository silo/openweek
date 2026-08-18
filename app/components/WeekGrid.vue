<script setup lang="ts">
import { getDay, parseISO } from 'date-fns'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { todayStr } from '~~/shared/utils/week'

const emit = defineEmits<{ openTask: [Task, DOMRect], convert: [CalendarEventDto] }>()

const week = useWeekStore()
const settings = useSettingsStore()
const cals = useCalendarsStore()

const today = todayStr()

/** Applied here rather than server-side so both toggles take effect without a refetch. */
function visibleEvents(events: CalendarEventDto[]) {
  if (settings.settings?.showCalendarEvents === false) return []
  return events.filter(e => !cals.hiddenSourceIds.has(e.sourceId))
}

function isWeekend(date: string) {
  const d = getDay(parseISO(date))
  return d === 0 || d === 6
}

const visibleDays = computed(() =>
  settings.settings?.showWeekends === false ? week.days.filter(d => !isWeekend(d.date)) : week.days,
)

/**
 * Focusing a day widens its column and narrows the rest, rather than hiding anything.
 * Ratios are the design's: 2.1fr against 0.85fr.
 */
const colTemplate = computed(() => {
  const days = visibleDays.value
  const focused = days.findIndex(d => d.date === week.focusDate)
  if (focused < 0) return `repeat(${days.length},minmax(0,1fr))`
  return days.map((_, i) => (i === focused ? 'minmax(0,2.1fr)' : 'minmax(0,0.85fr)')).join(' ')
})
</script>

<template>
  <div class="relative overflow-auto">
    <WeekSkeleton v-if="week.loading && !week.days.length" :columns="visibleDays.length || 7" />

    <div
      v-else
      class="grid min-h-full gap-px bg-ow-line transition-[grid-template-columns]"
      :style="{ gridTemplateColumns: colTemplate }"
    >
      <DayColumn
        v-for="d in visibleDays"
        :key="d.date"
        :date="d.date"
        :tasks="d.tasks"
        :events="visibleEvents(d.events)"
        :is-today="d.date === today"
        :is-weekend="isWeekend(d.date)"
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
