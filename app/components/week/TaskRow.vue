<script setup lang="ts">
import type { Task, TaskColor } from '#shared/types/task'
import { useBoardStore } from '~/stores/board'

const props = defineProps<{ task: Task }>()

const store = useBoardStore()
const editor = useTaskEditor()
const user = useAuthUser()
const { colors, swatchClass, tagVar, tagStyleClass } = useTaskColors()

const rowEl = ref<HTMLElement>()
const taskId = computed(() => props.task.id)
// Whole row is the drag handle (no separate grip); a click still edits the title.
const { dragging, edge } = useDraggableRow(rowEl, rowEl, taskId)

const editing = ref(false)
const draft = ref(props.task.title)
const inputEl = ref<HTMLInputElement>()

const tagClass = computed(() => tagStyleClass((user.value?.tagStyle as 'underline' | 'swipe') ?? 'underline'))
const noteLine = computed(() => props.task.notes?.split('\n')[0]?.trim() || '')
const sub = computed(() => {
  const kids = store.subtasksOf(props.task.id)
  return { total: kids.length, done: kids.filter(k => k.done).length }
})

function rruleLabel(rule: string | null): string {
  if (!rule)
    return ''
  if (/BYDAY=MO,TU,WE,TH,FR/.test(rule))
    return 'wkdays'
  if (/FREQ=DAILY/.test(rule))
    return 'daily'
  if (/FREQ=WEEKLY/.test(rule))
    return 'weekly'
  if (/FREQ=MONTHLY/.test(rule))
    return 'monthly'
  return 'repeats'
}

function startEdit() {
  draft.value = props.task.title
  editing.value = true
  nextTick(() => inputEl.value?.focus())
}
function commit() {
  if (!editing.value)
    return
  editing.value = false
  const next = draft.value.trim()
  if (next && next !== props.task.title)
    store.setTitle(props.task.id, next)
}
function cancel() {
  editing.value = false
  draft.value = props.task.title
}
function pickColor(c: TaskColor | null) {
  store.setColor(props.task.id, props.task.color === c ? null : c)
}
</script>

<template>
  <div
    ref="rowEl"
    class="group relative flex cursor-grab items-start gap-2.5 pr-1 active:cursor-grabbing"
    :class="dragging ? 'opacity-40' : ''"
  >
    <div v-if="edge === 'top'" class="absolute inset-x-0 -top-1.5 h-0.5 rounded bg-accent" />
    <div v-if="edge === 'bottom'" class="absolute inset-x-0 -bottom-1.5 h-0.5 rounded bg-accent" />

    <button
      type="button"
      class="mt-px shrink-0 font-mono text-[12px] leading-[1.5]"
      :class="task.done ? 'text-base-content/40' : 'text-base-content/30 hover:text-base-content/60'"
      :aria-label="task.done ? `Mark ${task.title} not done` : `Mark ${task.title} done`"
      @click.stop="store.toggleDone(task.id)"
    >
      {{ task.done ? '✓' : '○' }}
    </button>

    <div class="min-w-0 flex-1">
      <div class="font-mono text-[12.5px] leading-[1.5]">
        <span v-if="task.rolledOverFrom" class="text-base-content/30" title="Rolled over">↪ </span>
        <input
          v-if="editing"
          ref="inputEl"
          v-model="draft"
          class="w-full bg-transparent outline-none"
          @keydown.enter.prevent="commit"
          @keydown.esc.prevent="cancel"
          @blur="commit"
        >
        <button
          v-else
          type="button"
          class="text-left"
          :class="task.done ? 'text-base-content/45 line-through' : ''"
          @click.stop="startEdit"
        >
          <span v-if="task.color" :class="tagClass" :style="{ '--tag-col': tagVar(task.color) }">{{ task.title }}</span>
          <span v-else>{{ task.title }}</span>
        </button>
      </div>

      <div
        v-if="task.startTime || task.recurrenceRule || sub.total || task.linkedEventId"
        class="mt-1 flex flex-wrap items-center gap-2.5 font-mono text-[9.5px] text-base-content/45"
      >
        <span v-if="task.startTime">◷ {{ task.startTime }}</span>
        <span v-if="task.recurrenceRule">↻ {{ rruleLabel(task.recurrenceRule) }}</span>
        <span v-if="sub.total" :class="sub.done === sub.total ? 'text-success' : ''">☑ {{ sub.done }}/{{ sub.total }}</span>
        <span v-if="task.linkedEventId" class="rounded-full bg-base-200 px-1.5 py-px text-[8.5px]">⤺ linked</span>
      </div>

      <div v-if="noteLine" class="mt-1 text-[10.5px] italic leading-tight text-base-content/45">
        {{ noteLine }}
      </div>
    </div>

    <!-- Hover controls (absolute overlay — does not reserve row width) -->
    <div class="absolute right-0 top-0 hidden items-center gap-0.5 rounded bg-base-100/95 pl-1 group-focus-within:flex group-hover:flex">
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-xs px-1" aria-label="Color tag">
          <span class="size-3 rounded-full border border-hairline" :class="task.color ? swatchClass(task.color) : 'bg-base-100'" />
        </div>
        <ul tabindex="0" class="dropdown-content menu z-20 w-max gap-1 rounded-box border border-hairline bg-base-100 p-2 shadow">
          <li class="flex flex-row gap-1">
            <button v-for="c in colors" :key="c" type="button" class="size-5 rounded-full border border-hairline" :class="swatchClass(c)" :aria-label="c" @click="pickColor(c)" />
            <button type="button" class="size-5 rounded-full border border-hairline bg-base-100 text-xs" aria-label="No color" @click="pickColor(null)">✕</button>
          </li>
        </ul>
      </div>
      <button type="button" class="btn btn-ghost btn-xs px-1" :class="{ 'text-accent': task.notes }" aria-label="Notes & details" @click.stop="editor.open(task.id)">✎</button>
      <TaskMoveMenu :task="task" />
      <button type="button" class="btn btn-ghost btn-xs px-1" aria-label="Delete task" @click.stop="store.deleteTask(task.id)">✕</button>
    </div>
  </div>
</template>
