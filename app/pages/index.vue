<script setup lang="ts">
import { addDays, format, getISOWeek, parseISO } from 'date-fns'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { addDaysStr, startOfWeekStr, todayStr } from '~~/shared/utils/week'

const week = useWeekStore()
const settings = useSettingsStore()
const cals = useCalendarsStore()

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
  selected.value = null
  await Promise.all([week.loadWeek(start), cals.load(start)])
}
const prev = () => go(addDaysStr(currentStart.value, -7))
const next = () => go(addDaysStr(currentStart.value, 7))
const goToday = () => go(startOfWeekStr(todayStr(), weekStartsOn.value))

const rangeLabel = computed(() => {
  const s = parseISO(week.weekStart || currentStart.value)
  const e = addDays(s, 6)
  return s.getMonth() === e.getMonth()
    ? `${format(s, 'd')}–${format(e, 'd MMMM')}`
    : `${format(s, 'd MMM')} – ${format(e, 'd MMM')}`
})
const weekNumber = computed(() => getISOWeek(parseISO(week.weekStart || currentStart.value)))

const selected = ref<Task | null>(null)
const anchor = ref<DOMRect | null>(null)

const POPOVER = { w: 320, h: 400, gap: 8, margin: 12 }

/** Anchor the popover under its row, flipping above and clamping so it stays on screen. */
const popoverStyle = computed(() => {
  if (!anchor.value) return {}
  const r = anchor.value
  const left = Math.min(Math.max(r.left - 4, POPOVER.margin), window.innerWidth - POPOVER.w - POPOVER.margin)
  const below = r.bottom + POPOVER.gap
  const flip = below + POPOVER.h > window.innerHeight
  const top = flip
    ? Math.max(POPOVER.margin, r.top - POPOVER.h - POPOVER.gap)
    : below
  return { position: 'fixed' as const, left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
})

function openTask(task: Task, rect: DOMRect) {
  selected.value = task
  anchor.value = rect
}

/** Search results have no row to anchor to, so the popover hangs under the search box. */
function openFromSearch(task: Task) {
  openTask(task, new DOMRect(window.innerWidth - 360, 96, POPOVER.w, 0))
}

// The design converts straight from the event row — no confirmation step.
function convert(e: CalendarEventDto) {
  return week.convertEvent(e.id, true, e.localDate)
}

onMounted(() => {
  cals.load(currentStart.value)
  const stop = taskBoardMonitor(({ taskId, over }) => {
    if (over.kind === 'task') week.moveRelative(taskId, over.container, over.taskId, over.after)
    else week.moveRelative(taskId, over.container, null, false)
  })
  onUnmounted(stop)
})
</script>

<template>
  <div class="min-h-screen bg-ow-bg p-6">
    <div class="mx-auto flex max-w-[1660px] flex-col overflow-hidden rounded-2xl border border-ow-border bg-ow-surface shadow-ow-4">
      <TopBar
        :range-label="rangeLabel"
        :week-number="weekNumber"
        @prev="prev"
        @next="next"
        @today="goToday"
        @open-task="openFromSearch"
      />
      <RolloverReview />
      <WeekGrid @open-task="openTask" @convert="convert" />
      <ListsRail @open-task="openTask" />
    </div>

    <TaskDetailPopover
      v-if="selected"
      :key="selected.id"
      :task="selected"
      :style="popoverStyle"
      @close="selected = null"
    />
  </div>
</template>
