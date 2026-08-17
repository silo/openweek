<script setup lang="ts">
import { addDays, format, getISOWeek, parseISO } from 'date-fns'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { addDaysStr, startOfWeekStr, todayStr } from '~~/shared/utils/week'

const week = useWeekStore()
const settings = useSettingsStore()

// Ensure settings (week-start) are loaded before computing the first week.
await useAsyncData('settings', async () => {
  if (!settings.settings) await settings.load()
  return settings.settings
})

const weekStartsOn = computed(() => (settings.settings?.weekStartsOn ?? 1) as 0 | 1)
const currentStart = ref(startOfWeekStr(todayStr(), weekStartsOn.value))

await useAsyncData('week', async () => {
  await week.loadWeek(currentStart.value)
  return week.weekStart
})

async function go(start: string) {
  currentStart.value = start
  await week.loadWeek(start)
}
const prev = () => go(addDaysStr(currentStart.value, -7))
const next = () => go(addDaysStr(currentStart.value, 7))
const goToday = () => go(startOfWeekStr(todayStr(), weekStartsOn.value))

const rangeLabel = computed(() => {
  const s = parseISO(week.weekStart || currentStart.value)
  const e = addDays(s, 6)
  return s.getMonth() === e.getMonth()
    ? `${format(s, 'MMMM d')} – ${format(e, 'd')}`
    : `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`
})
const weekNumber = computed(() => getISOWeek(parseISO(week.weekStart || currentStart.value)))

const selected = ref<Task | null>(null)
const converting = ref<CalendarEventDto | null>(null)
const searchOpen = ref(false)

function onJump(date: string) {
  go(startOfWeekStr(date, weekStartsOn.value))
}
function onOpenList(listId: string) {
  return week.loadList(listId)
}

onMounted(() => {
  const stop = taskBoardMonitor(({ taskId, over }) => {
    if (over.kind === 'task') week.moveRelative(taskId, { date: over.date }, over.taskId, over.after)
    else week.moveRelative(taskId, { date: over.date }, null, false)
  })
  onUnmounted(stop)
})
</script>

<template>
  <div class="flex h-screen flex-col bg-ow-surface">
    <TopBar :range-label="rangeLabel" :week-number="weekNumber" @prev="prev" @next="next" @today="goToday" @search="searchOpen = true" />
    <WeekGrid @open-task="(t) => (selected = t)" @convert="(e) => (converting = e)" />
    <ListDrawer @open-task="(t) => (selected = t)" />
    <TaskDetailPopover v-if="selected" :task="selected" @close="selected = null" />
    <ConvertEventPopover v-if="converting" :event="converting" @close="converting = null" />
    <GlobalSearch v-if="searchOpen" @close="searchOpen = false" @jump="onJump" @open-list="onOpenList" />
  </div>
</template>
