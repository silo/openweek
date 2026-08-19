<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import type { Task } from '~~/shared/schemas/task'
import type { Container, Edge } from '~/composables/useTaskBoard'
import { inkColor, inkEdge, inkTint } from '~~/shared/constants/colors'
import { isRolledOver } from '~~/shared/utils/task'

const props = defineProps<{ task: Task, container: Container }>()
/** The row's rect travels with the event so the detail popover can anchor to it. */
const emit = defineEmits<{ open: [Task, DOMRect] }>()

const week = useWeekStore()
const settings = useSettingsStore()

const row = ref<HTMLElement | null>(null)
const edge = ref<Edge | null>(null)
const dragging = ref(false)

const done = computed(() => !!props.task.completedAt)
const ink = computed(() => props.task.highlightColor)
const fillMode = computed(() => settings.settings?.tagStyle === 'fill')

/** In `fill` the whole row takes a tint and a matching ring; in `edge` a bar runs down the left. */
const rowStyle = computed(() => {
  if (done.value) return { background: 'transparent', boxShadow: 'none' }
  if (ink.value && fillMode.value) {
    return {
      background: inkTint(ink.value),
      boxShadow: `0 0 0 1px ${inkEdge(ink.value)}`,
    }
  }
  return { background: 'var(--ow-surface)', boxShadow: '0 0 0 1px var(--ow-hairline)' }
})
const showBar = computed(() => !!ink.value && !done.value && !fillMode.value)

const rolledFrom = computed(() => {
  if (!isRolledOver(props.task)) return null
  return `from ${format(parseISO(props.task.originalDate!), 'EEE d MMM')}`
})
const hasMeta = computed(() => !!props.task.timeOfDay || !!props.task.note || !!rolledFrom.value)

onMounted(() => {
  if (!row.value) return
  const stopDrag = taskDraggable(row.value, props.task.id, {
    onStart: () => {
      dragging.value = true
      week.draggingId = props.task.id
    },
    onEnd: () => {
      dragging.value = false
      week.draggingId = null
    },
  })
  const stopDrop = taskDropTarget(row.value, props.task.id, props.container, e => (edge.value = e))
  onUnmounted(() => { stopDrag(); stopDrop() })
})
</script>

<template>
  <div>
    <DropLine v-if="edge === 'top'" />

    <div
      ref="row"
      class="ow-row relative mb-2 flex cursor-grab items-start gap-[9px] rounded-[9px] px-[9px] py-2"
      :class="dragging && 'ow-row-dragging'"
      :style="rowStyle"
      @click="row && emit('open', task, row.getBoundingClientRect())"
    >
      <span
        v-if="showBar"
        class="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[9px]"
        :style="{ background: inkColor(ink) }"
        aria-hidden="true"
      />

      <button
        type="button"
        title="Mark done"
        :aria-label="done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`"
        :aria-pressed="done"
        class="mt-px h-[19px] w-[19px] flex-none cursor-pointer rounded-md p-0 text-[11px] leading-[15px] transition-colors"
        :style="{
          border: `1.6px solid ${done ? 'var(--ow-today)' : 'var(--ow-mark)'}`,
          background: done ? 'var(--ow-today)' : 'var(--ow-surface)',
          color: 'var(--ow-surface)',
        }"
        @click.stop="week.toggleComplete(task.id)"
      >
        {{ done ? '✓' : '' }}
      </button>

      <div class="min-w-0 flex-1">
        <div
          class="text-[14.5px] leading-[1.4]"
          :class="done ? 'text-ow-done line-through decoration-ow-ghost' : 'text-ow-ink'"
        >
          {{ task.title }}
        </div>
        <div v-if="hasMeta" class="mt-[3px] flex items-center gap-[9px] text-xs text-ow-secondary">
          <span v-if="task.timeOfDay" class="tabular-nums">{{ task.timeOfDay.slice(0, 5) }}</span>
          <span v-if="rolledFrom" title="Carried over" :style="{ color: 'var(--ow-accent)' }">↻ {{ rolledFrom }}</span>
          <span v-if="task.note" title="Has a note">≡</span>
        </div>
      </div>
    </div>

    <DropLine v-if="edge === 'bottom'" />
  </div>
</template>

<style scoped>
.ow-row {
  transition: opacity 140ms ease;
}

/* The row left behind fades to show it is in transit. No transform: this is the source
   element, not the thing under the cursor, so tilting it reads as the wrong item moving. */
.ow-row-dragging {
  opacity: 0.45;
}

@media (prefers-reduced-motion: reduce) {
  .ow-row { transition: none; }
}
</style>
