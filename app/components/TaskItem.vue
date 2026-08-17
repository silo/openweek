<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'
import { HIGHLIGHT } from '~~/shared/constants/colors'
import type { Edge } from '~/composables/useTaskBoard'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ open: [] }>()
const week = useWeekStore()
const settings = useSettingsStore()

const done = computed(() => !!props.task.completedAt)
const rolled = computed(() => !!props.task.originalDate && !!props.task.date && props.task.originalDate < props.task.date)
const hlHex = computed(() => (props.task.highlightColor ? HIGHLIGHT[props.task.highlightColor] : null))
const hlClass = computed(() => (settings.settings?.tagStyle === 'swipe' ? 'hl-swipe' : 'hl-underline'))

const rootEl = ref<HTMLElement>()
const dragging = ref(false)
const edge = ref<Edge | null>(null)

onMounted(() => {
  const el = rootEl.value
  const date = props.task.date
  if (!el || !date) return
  const cleanups = [
    taskDraggable(el, props.task.id, { onStart: () => (dragging.value = true), onEnd: () => (dragging.value = false) }),
    taskDropTarget(el, props.task.id, date, e => (edge.value = e)),
  ]
  onUnmounted(() => cleanups.forEach(fn => fn()))
})
</script>

<template>
  <div ref="rootEl" class="group relative flex items-start gap-2.5" :class="dragging ? 'opacity-40' : ''">
    <div v-if="edge === 'top'" class="pointer-events-none absolute -top-1.5 left-4 right-0 h-0.5 rounded-full" style="background: var(--ow-accent);" />

    <button
      class="mt-px shrink-0 cursor-grab font-display text-[12px] leading-normal active:cursor-grabbing"
      :class="done ? 'text-ow-faint' : 'text-ow-ghost hover:text-ow-muted'"
      :aria-pressed="done"
      :aria-label="done ? 'Mark incomplete' : 'Mark complete'"
      @click="week.toggleComplete(task.id)"
    >
      {{ done ? '✓' : '○' }}
    </button>

    <div class="min-w-0 flex-1 cursor-text" @click="emit('open')">
      <div class="font-display text-[12.5px] leading-normal">
        <span v-if="rolled" class="text-ow-ghost">↪ </span>
        <span v-if="hlHex" :class="[hlClass, done ? 'line-through opacity-70' : '']" :style="{ '--hl': hlHex }">{{ task.title }}</span>
        <span v-else :class="done ? 'text-ow-faint line-through' : 'text-ow-ink'">{{ task.title }}</span>
      </div>
      <div v-if="task.timeOfDay" class="mt-1 font-display text-[9.5px] text-ow-faint">◷ {{ task.timeOfDay.slice(0, 5) }}</div>
      <div v-if="task.sourceLabel" class="mt-1 inline-flex items-center gap-1 rounded-full bg-ow-sunken px-2 py-0.5 font-display text-[8.5px] text-ow-muted">⤺ from {{ task.sourceLabel }}</div>
      <div v-if="task.note" class="mt-1 font-body text-[10.5px] italic leading-snug text-ow-faint">{{ task.note }}</div>
    </div>

    <div v-if="edge === 'bottom'" class="pointer-events-none absolute -bottom-1.5 left-4 right-0 h-0.5 rounded-full" style="background: var(--ow-accent);" />
  </div>
</template>
