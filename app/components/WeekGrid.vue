<script setup lang="ts">
import { getDay, parseISO } from 'date-fns'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { todayStr } from '~~/shared/utils/week'

const emit = defineEmits<{ openTask: [Task, DOMRect], convert: [CalendarEventDto] }>()

const week = useWeekStore()
const settings = useSettingsStore()

const today = todayStr()

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
  <div>
    <div v-if="week.weekEmpty" class="pb-0.5 pt-[26px] text-center">
      <p class="font-display text-2xl font-semibold tracking-[-0.02em] text-ow-title">
        A clear week.
      </p>
      <p class="mt-1 text-sm text-ow-muted">
        Add a task on any day, or drag one up from a list below.
      </p>
    </div>

    <WeekSkeleton v-if="week.loading && !week.days.length" :columns="visibleDays.length || 7" />

    <div
      v-else
      class="grid gap-px bg-ow-line transition-[grid-template-columns]"
      :style="{ gridTemplateColumns: colTemplate }"
    >
      <DayColumn
        v-for="d in visibleDays"
        :key="d.date"
        :date="d.date"
        :tasks="d.tasks"
        :events="d.events"
        :is-today="d.date === today"
        :is-weekend="isWeekend(d.date)"
        @open-task="(t, r) => emit('openTask', t, r)"
        @convert="emit('convert', $event)"
      />
    </div>
  </div>
</template>
