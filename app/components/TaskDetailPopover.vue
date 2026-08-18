<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import type { Task, TaskUpdate } from '~~/shared/schemas/task'
import { HIGHLIGHT_INKS, INK_LABELS } from '~~/shared/constants/colors'
import { containerKey, parseContainer } from '~/composables/useTaskBoard'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ close: [] }>()

const week = useWeekStore()

const panel = ref<HTMLElement | null>(null)
useDismissable(panel, () => emit('close'))
useFocusTrap(panel)

const title = ref(props.task.title)
const time = ref(props.task.timeOfDay?.slice(0, 5) ?? '')
const note = ref(props.task.note ?? '')

/**
 * "Move to…" spans every day and every list — this is the keyboard path that pairs with
 * dragging, so it must stay exhaustive.
 */
const moveValue = computed(() => {
  const c = week.containerOf(props.task.id)
  return c ? containerKey(c) : ''
})
const dayOptions = computed(() =>
  week.days.map(d => ({ value: containerKey({ date: d.date }), label: format(parseISO(d.date), 'EEEE d') })),
)
const listOptions = computed(() =>
  week.lists.map(l => ({ value: containerKey({ listId: l.id }), label: l.name })),
)

function onMove(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  if (value) week.moveTask(props.task.id, parseContainer(value))
}
function pickInk(ink: Task['highlightColor']) {
  week.updateTask(props.task.id, { highlightColor: props.task.highlightColor === ink ? null : ink })
}

/**
 * Text fields autosave.
 *
 * Relying on `blur` alone lost edits: clicking outside closes the popover on mousedown,
 * which unmounts the field before it can blur. So each keystroke queues a save, and
 * whatever is still pending is flushed on unmount.
 */
const SAVE_DELAY = 500
let pending: ReturnType<typeof setTimeout> | undefined

function commit() {
  clearTimeout(pending)
  pending = undefined

  const patch: TaskUpdate = {}
  const nextTitle = title.value.trim()
  if (nextTitle && nextTitle !== props.task.title) patch.title = nextTitle

  const nextTime = time.value.trim() || null
  if (nextTime !== (props.task.timeOfDay?.slice(0, 5) ?? null)) patch.timeOfDay = nextTime

  const nextNote = note.value.trim() || null
  if (nextNote !== (props.task.note || null)) patch.note = nextNote

  if (Object.keys(patch).length) week.updateTask(props.task.id, patch)
}

function queueCommit() {
  clearTimeout(pending)
  pending = setTimeout(commit, SAVE_DELAY)
}

onBeforeUnmount(commit)
async function remove() {
  await week.deleteTask(props.task.id)
  emit('close')
}
</script>

<template>
  <div
    ref="panel"
    role="dialog"
    aria-label="Task details"
    class="absolute z-[60] flex w-[320px] flex-col gap-3 rounded-[14px] border border-ow-border-strong bg-ow-surface p-4 shadow-ow-3"
  >
    <button
      type="button"
      title="Close"
      aria-label="Close"
      class="absolute right-3 top-2.5 cursor-pointer border-none bg-transparent p-0.5 text-base leading-none text-ow-muted"
      @click="emit('close')"
    >
      ×
    </button>

    <input
      v-model="title"
      type="text"
      aria-label="Task title"
      class="w-full border-none border-b border-ow-hairline bg-transparent pb-[9px] pr-[22px] font-display text-lg font-semibold tracking-[-0.02em] outline-none"
      style="border-bottom: 1px solid var(--ow-hairline);"
      @input="queueCommit"
      @blur="commit"
      @keydown.enter.prevent="commit"
    >

    <div class="flex items-center gap-2">
      <button
        type="button"
        title="None"
        aria-label="No highlight"
        :aria-pressed="task.highlightColor === null"
        class="h-[22px] w-[22px] cursor-pointer rounded-[7px] border border-ow-control p-0"
        :style="{
          background: 'linear-gradient(135deg,transparent 44%,var(--ow-control) 44%,var(--ow-control) 56%,transparent 56%)',
          boxShadow: task.highlightColor === null ? '0 0 0 2px var(--ow-surface), 0 0 0 3.5px var(--ow-ink)' : 'none',
        }"
        @click="week.updateTask(task.id, { highlightColor: null })"
      />
      <button
        v-for="ink in HIGHLIGHT_INKS"
        :key="ink"
        type="button"
        :title="INK_LABELS[ink]"
        :aria-label="INK_LABELS[ink]"
        :aria-pressed="task.highlightColor === ink"
        class="h-[22px] w-[22px] cursor-pointer rounded-[7px] p-0"
        :style="{
          background: `var(--ow-hl-${ink})`,
          border: `1px solid var(--ow-hl-${ink})`,
          boxShadow: task.highlightColor === ink ? '0 0 0 2px var(--ow-surface), 0 0 0 3.5px var(--ow-ink)' : 'none',
        }"
        @click="pickInk(ink)"
      />
      <div class="flex-1" />
      <span class="text-[11.5px] font-semibold tracking-[0.06em] text-ow-muted">HIGHLIGHT</span>
    </div>

    <div class="flex gap-[9px]">
      <div class="flex flex-none flex-col gap-[5px]">
        <label for="ow-task-time" class="text-[11.5px] font-semibold tracking-[0.06em] text-ow-muted">TIME</label>
        <input
          id="ow-task-time"
          v-model="time"
          type="time"
          placeholder="––:––"
          class="w-20 rounded-[9px] border border-ow-border bg-ow-surface px-[9px] py-2 text-[13px] tabular-nums outline-none"
          @input="queueCommit"
          @blur="commit"
        >
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-[5px]">
        <label for="ow-task-move" class="text-[11.5px] font-semibold tracking-[0.06em] text-ow-muted">MOVE TO</label>
        <select
          id="ow-task-move"
          :value="moveValue"
          class="w-full rounded-[9px] border border-ow-border bg-ow-surface px-[7px] py-2 text-[13.5px] text-ow-ink"
          @change="onMove"
        >
          <option v-for="o in dayOptions" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
          <option disabled>
            — lists —
          </option>
          <option v-for="o in listOptions" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex flex-col gap-[5px]">
      <label for="ow-task-note" class="text-[11.5px] font-semibold tracking-[0.06em] text-ow-muted">NOTE</label>
      <textarea
        id="ow-task-note"
        v-model="note"
        rows="2"
        placeholder="Add a note…"
        class="resize-none rounded-[9px] border border-ow-border bg-ow-surface px-[9px] py-2 font-body text-[13.5px] leading-relaxed outline-none"
        @input="queueCommit"
        @blur="commit"
      />
    </div>

    <div class="flex items-center gap-2.5 border-t border-ow-hairline pt-[11px]">
      <button
        type="button"
        class="cursor-pointer border-none bg-transparent p-0 text-[13.5px]"
        style="color: var(--color-error);"
        @click="remove"
      >
        Delete
      </button>
      <!-- The schema already carries subtasks and recurrence; the UI is deliberately deferred. -->
      <div class="flex-1 text-right text-[11.5px] font-semibold tracking-[0.04em] text-ow-ghost">
        SOON: SUBTASKS · REPEAT
      </div>
    </div>
  </div>
</template>
