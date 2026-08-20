<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import type { Task } from '~~/shared/schemas/task'
import type { Container, Edge } from '~/composables/useTaskBoard'
import { inkColor, inkEdge, inkTint } from '~~/shared/constants/colors'
import { isPending, isRolledOver } from '~~/shared/utils/task'

const props = defineProps<{ task: Task, container: Container }>()
/** The row's rect travels with the event so the detail popover can anchor to it. */
const emit = defineEmits<{ open: [Task, DOMRect] }>()

const week = useWeekStore()
const settings = useSettingsStore()

const row = ref<HTMLElement | null>(null)
const edge = ref<Edge | null>(null)
const dragging = ref(false)

const done = computed(() => !!props.task.completedAt)
/**
 * A just-added row is on screen before the server has given it an id. Ticking it in that
 * window would PATCH the placeholder, 404, and quietly un-tick itself, so the box waits.
 */
const pending = computed(() => isPending(props.task))
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
  // A row on a day that has gone still drags out, but nothing drops onto it — the whole
  // column is closed to new tasks.
  const stopDrop = week.isPastContainer(props.container)
    ? () => {}
    : taskDropTarget(row.value, props.task.id, props.container, e => (edge.value = e))
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
        :disabled="pending"
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
          class="ow-title text-[14.5px] leading-[1.4]"
          :class="done ? 'text-ow-done' : 'text-ow-ink'"
        >
          <span class="ow-strike" :class="done && 'ow-strike-on'">{{ task.title }}</span>
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

/* The strike is drawn, not switched on. `text-decoration` cannot animate, so the line is a
   background gradient grown from nothing to the full width of the title — which, unlike an
   absolutely positioned rule, follows the text onto a second line when it wraps. */
.ow-title {
  transition: color 220ms ease;
}

.ow-strike {
  /* `clone`, so a title that wraps is struck on every line: with the default `slice` the
     gradient's 100% resolves against the first line only and the rest goes unmarked. */
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 0.58em;
  background-size: 0% 1.5px;
  transition: background-size 240ms ease;
}

.ow-strike-on {
  background-size: 100% 1.5px;
}

/* The row left behind fades to show it is in transit. No transform: this is the source
   element, not the thing under the cursor, so tilting it reads as the wrong item moving. */
.ow-row-dragging {
  opacity: 0.45;
}

@media (prefers-reduced-motion: reduce) {
  .ow-row,
  .ow-title,
  .ow-strike { transition: none; }
}
</style>
