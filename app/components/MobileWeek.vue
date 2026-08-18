<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { todayStr } from '~~/shared/utils/week'

const props = defineProps<{ rangeLabel: string, weekNumber: number }>()
const emit = defineEmits<{
  openTask: [Task, DOMRect]
  convert: [CalendarEventDto]
  prev: []
  next: []
}>()

const week = useWeekStore()

const today = todayStr()
const selectedDate = ref<string | null>(null)

/** Default to today when it is in view, otherwise the first day of the week. */
const activeDate = computed(() =>
  selectedDate.value ?? (week.days.some(d => d.date === today) ? today : week.days[0]?.date ?? ''),
)
const activeDay = computed(() => week.days.find(d => d.date === activeDate.value))
const container = computed(() => ({ date: activeDate.value }))

const dayLabel = computed(() => {
  if (!activeDay.value) return ''
  const name = format(parseISO(activeDay.value.date), 'EEEE').toUpperCase()
  return activeDay.value.date === today ? `${name} · TODAY` : `${name} ${format(parseISO(activeDay.value.date), 'd')}`
})
const shortLabel = computed(() =>
  activeDay.value ? format(parseISO(activeDay.value.date), 'EEE') : '',
)
const openCount = computed(() => activeDay.value?.tasks.filter(t => !t.completedAt).length ?? 0)

const doneLabel = computed(() =>
  week.totalCount > 0 ? `${week.doneCount} of ${week.totalCount} done` : 'nothing planned',
)

function strip(date: string) {
  const d = parseISO(date)
  return {
    letter: format(d, 'EEEEE'),
    num: format(d, 'd'),
    isToday: date === today,
    isActive: date === activeDate.value,
    hasOpen: (week.days.find(x => x.date === date)?.tasks.filter(t => !t.completedAt).length ?? 0) > 0,
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ow-surface pb-[68px]">
    <header class="flex items-center gap-3 border-b border-ow-line px-4 py-3">
      <BrandMark :show-wordmark="false" />
      <span class="font-display text-base font-semibold tracking-[-0.02em] text-ow-ink">Openweek</span>
      <span class="rounded-md bg-ow-sunken px-1.5 py-0.5 text-[11.5px] font-semibold text-ow-secondary">
        W{{ props.weekNumber }}
      </span>
      <div class="flex-1" />
      <AccountMenu />
    </header>

    <div class="flex items-center gap-2 px-4 py-2.5">
      <OwButton square size="sm" aria-label="Previous week" @click="emit('prev')">
        ‹
      </OwButton>
      <span class="text-[13.5px] font-semibold text-ow-ink">{{ props.rangeLabel }}</span>
      <OwButton square size="sm" aria-label="Next week" @click="emit('next')">
        ›
      </OwButton>
      <div class="flex-1" />
      <span class="text-[12.5px] text-ow-muted">{{ doneLabel }}</span>
    </div>

    <!-- day strip: pans the week, one day fills the screen -->
    <div class="flex gap-1.5 overflow-x-auto border-b border-ow-line px-4 pb-3">
      <button
        v-for="d in week.days"
        :key="d.date"
        type="button"
        :aria-pressed="strip(d.date).isActive"
        :aria-label="format(parseISO(d.date), 'EEEE d MMMM')"
        class="flex min-w-[44px] flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-[10px] border px-1 py-1.5 transition-colors"
        :class="strip(d.date).isActive ? 'border-ow-border-strong bg-ow-sunken' : 'border-transparent bg-transparent'"
        @click="selectedDate = d.date"
      >
        <span class="text-[10.5px] font-semibold tracking-[0.06em] text-ow-muted">{{ strip(d.date).letter }}</span>
        <span
          class="font-display text-[17px] font-semibold leading-none"
          :style="strip(d.date).isToday ? { color: 'var(--ow-today)' } : { color: 'var(--ow-ink)' }"
        >{{ strip(d.date).num }}</span>
        <span
          class="h-[5px] w-[5px] rounded-full"
          :style="{ background: strip(d.date).hasOpen ? 'var(--ow-hl-jade)' : 'transparent' }"
          aria-hidden="true"
        />
      </button>
    </div>

    <section v-if="activeDay" class="flex flex-1 flex-col px-4 pt-4">
      <div class="flex items-baseline gap-2 pb-3">
        <h2 class="text-[12.5px] font-semibold tracking-[0.06em] text-ow-secondary">
          {{ dayLabel }}
        </h2>
        <div class="flex-1" />
        <span v-if="openCount" class="text-xs text-ow-muted">{{ openCount }} open</span>
      </div>

      <EventItem
        v-for="ev in activeDay.events"
        :key="ev.id"
        :event="ev"
        @convert="emit('convert', $event)"
      />

      <div v-if="activeDay.events.length" class="mb-3 mt-2 flex items-center gap-[7px]">
        <span class="text-[10.5px] font-semibold tracking-[0.07em] text-ow-ghost">TASKS</span>
        <span class="h-px flex-1 bg-ow-hairline" />
      </div>

      <TaskItem
        v-for="t in activeDay.tasks"
        :key="t.id"
        :task="t"
        :container="container"
        @open="(task, rect) => emit('openTask', task, rect)"
      />

      <TaskComposer :container="container" :label="`＋ Add to ${shortLabel}`" />
    </section>

    <nav class="fixed bottom-0 left-0 right-0 flex border-t border-ow-line bg-ow-surface">
      <NuxtLink
        to="/"
        class="flex-1 py-3 text-center text-[12.5px] font-semibold text-ow-ink no-underline"
      >
        Week
      </NuxtLink>
      <a href="#ow-lists" class="flex-1 py-3 text-center text-[12.5px] text-ow-muted no-underline">Lists</a>
      <NuxtLink to="/settings" class="flex-1 py-3 text-center text-[12.5px] text-ow-muted no-underline">
        Settings
      </NuxtLink>
    </nav>
  </div>
</template>
