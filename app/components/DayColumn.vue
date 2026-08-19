<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'
import { isPastDate, todayStr } from '~~/shared/utils/week'

const props = defineProps<{
  date: string
  tasks: Task[]
  events: CalendarEventDto[]
  isToday: boolean
  isWeekend: boolean
}>()
const emit = defineEmits<{ openTask: [Task, DOMRect], convert: [CalendarEventDto] }>()

const week = useWeekStore()

const col = ref<HTMLElement | null>(null)
const container = computed(() => ({ date: props.date }))
/** True while a dragged task is over the column itself rather than one of its rows. */
const dropAtEnd = ref(false)

const dateNum = computed(() => format(parseISO(props.date), 'd'))
const weekdayLabel = computed(() => format(parseISO(props.date), 'EEE').toUpperCase())
const fullDate = computed(() => format(parseISO(props.date), 'EEEE d MMMM'))

const isFocused = computed(() => week.focusDate === props.date)
const openLeft = computed(() => props.tasks.filter(t => !t.completedAt).length)
/** A day that has gone takes no new tasks: no composer, and nothing can be dropped into it. */
const isPast = computed(() => isPastDate(props.date, todayStr()))

// Destructured so the refs unwrap in the template.
const { visibleTasks, hasFold, isOpen: foldOpen, label: foldLabel, toggle: toggleFold }
  = useDoneFold(container, () => props.tasks)

onMounted(() => {
  if (col.value && !isPast.value) {
    const stop = containerDropTarget(col.value, container.value, a => (dropAtEnd.value = a))
    onUnmounted(stop)
  }
})
</script>

<template>
  <div
    ref="col"
    class="flex min-h-[320px] flex-col px-[11px] pb-4 pt-3.5"
    :style="{
      background: isWeekend ? 'var(--ow-surface-weekend)' : 'var(--ow-surface)',
      boxShadow: isToday ? 'inset 0 2px 0 0 var(--ow-today)' : 'none',
    }"
  >
    <!-- The visible label is just "17 MON"; spell out what the button does for screen readers. -->
    <button
      type="button"
      :title="isFocused ? 'Back to the even week' : 'Focus this day'"
      :aria-label="`${fullDate} — ${isFocused ? 'back to the even week' : 'focus this day'}`"
      :aria-pressed="isFocused"
      class="flex cursor-pointer items-baseline gap-2 border-none bg-transparent px-0.5 text-left"
      @click="week.toggleFocus(date)"
    >
      <span
        class="font-display text-[27px] font-semibold leading-none tracking-[-0.03em]"
        :class="isWeekend && !isToday ? 'text-ow-strong' : 'text-ow-ink'"
      >{{ dateNum }}</span>
      <span
        class="text-[12.5px] font-semibold tracking-[0.06em]"
        :class="isWeekend ? 'text-ow-muted' : 'text-ow-secondary'"
      >{{ weekdayLabel }}</span>
      <span class="flex-1" />
      <span
        v-if="isFocused"
        class="rounded-[5px] bg-ow-sunken px-[7px] py-0.5 text-[11px] font-semibold tracking-[0.06em] text-ow-secondary"
      >FOCUS ×</span>
      <span
        v-if="isToday"
        class="rounded-[5px] border px-[7px] py-0.5 text-[11px] font-semibold tracking-[0.07em]"
        :style="{ color: 'var(--ow-today)', borderColor: 'var(--ow-select-edge)' }"
      >TODAY</span>
      <span v-if="openLeft > 0" class="text-xs text-ow-muted">{{ openLeft }} left</span>
    </button>

    <div class="my-[11px] h-px bg-ow-line" />

    <EventItem v-for="ev in events" :key="ev.id" :event="ev" @convert="emit('convert', $event)" />

    <div v-if="events.length" class="mx-0.5 mb-[11px] mt-[7px] flex items-center gap-[7px]">
      <span class="text-[10.5px] font-semibold tracking-[0.07em] text-ow-ghost">TASKS</span>
      <span class="h-px flex-1 bg-ow-hairline" />
    </div>

    <TaskItem
      v-for="t in visibleTasks"
      :key="t.id"
      :task="t"
      :container="container"
      @open="(t, r) => emit('openTask', t, r)"
    />

    <DropLine v-if="dropAtEnd" />
    <DoneFold v-if="hasFold" :label="foldLabel" :expanded="foldOpen" @click="toggleFold" />

    <TaskComposer v-if="!isPast" :container="container" />

    <div class="flex-1" />
  </div>
</template>
