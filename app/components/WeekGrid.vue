<script setup lang="ts">
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { todayStr } from '~~/shared/utils/week'

const week = useWeekStore()
const emit = defineEmits<{ openTask: [task: Task], convert: [event: CalendarEventDto] }>()
const today = todayStr()

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
function weekdayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]!
}
function dayNumOf(dateStr: string): string {
  return String(Number(dateStr.split('-')[2]))
}
</script>

<template>
  <div class="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-7">
    <DayColumn
      v-for="d in week.days"
      :key="d.date"
      :date="d.date"
      :tasks="d.tasks"
      :events="d.events"
      :is-today="d.date === today"
      :weekday="weekdayOf(d.date)"
      :day-num="dayNumOf(d.date)"
      @open-task="t => emit('openTask', t)"
      @convert="e => emit('convert', e)"
    />
  </div>
</template>
