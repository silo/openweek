<script setup lang="ts">
import type { Task, TaskColor } from '#shared/types/task'
import { useBoardStore } from '~/stores/board'

const props = defineProps<{ task: Task }>()

const store = useBoardStore()
const editor = useTaskEditor()
const { colors, swatchClass, highlightClass } = useTaskColors()

const rowEl = ref<HTMLElement>()
const gripEl = ref<HTMLElement>()
const taskId = computed(() => props.task.id)
const { dragging, edge } = useDraggableRow(rowEl, gripEl, taskId)

const editing = ref(false)
const draft = ref(props.task.title)
const inputEl = ref<HTMLInputElement>()

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
    class="group relative flex items-start gap-1 rounded px-1 py-1 transition-colors hover:bg-base-200"
    :class="[highlightClass(task.color), dragging ? 'opacity-40' : '']"
  >
    <!-- Drop indicators (closest edge) -->
    <div v-if="edge === 'top'" class="absolute inset-x-1 -top-px h-0.5 rounded bg-primary" />
    <div v-if="edge === 'bottom'" class="absolute inset-x-1 -bottom-px h-0.5 rounded bg-primary" />

    <!-- Drag handle -->
    <button
      ref="gripEl"
      type="button"
      tabindex="-1"
      class="mt-0.5 cursor-grab select-none text-xs opacity-0 transition-opacity group-hover:opacity-40 active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      ⠿
    </button>

    <input
      type="checkbox"
      class="checkbox checkbox-xs mt-0.5"
      :checked="task.done"
      :aria-label="`Mark ${task.title} done`"
      @change="store.toggleDone(task.id)"
    >

    <input
      v-if="editing"
      ref="inputEl"
      v-model="draft"
      class="min-w-0 flex-1 bg-transparent text-sm outline-none"
      @keydown.enter.prevent="commit"
      @keydown.esc.prevent="cancel"
      @blur="commit"
    >
    <button
      v-else
      type="button"
      class="min-w-0 flex-1 break-words text-left text-sm leading-snug"
      :class="{ 'line-through opacity-50': task.done }"
      @click="startEdit"
    >
      {{ task.title }}
      <span v-if="task.rolledOverFrom" class="ml-1 text-xs opacity-40" title="Rolled over">↪</span>
    </button>

    <!-- Hover controls -->
    <div class="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-xs px-1" aria-label="Color tag">
          <span class="size-3 rounded-full border border-hairline" :class="task.color ? swatchClass(task.color) : 'bg-base-100'" />
        </div>
        <ul tabindex="0" class="dropdown-content menu z-20 w-max gap-1 rounded-box bg-base-100 p-2 shadow">
          <li class="flex flex-row gap-1">
            <button v-for="c in colors" :key="c" type="button" class="size-5 rounded-full border border-hairline" :class="swatchClass(c)" :aria-label="c" @click="pickColor(c)" />
            <button type="button" class="size-5 rounded-full border border-hairline bg-base-100 text-xs" aria-label="No color" @click="pickColor(null)">✕</button>
          </li>
        </ul>
      </div>

      <button type="button" class="btn btn-ghost btn-xs px-1" :class="{ 'text-primary': task.notes }" aria-label="Notes" @click="editor.open(task.id)">
        ✎
      </button>

      <TaskMoveMenu :task="task" />

      <button type="button" class="btn btn-ghost btn-xs px-1" aria-label="Delete task" @click="store.deleteTask(task.id)">
        ✕
      </button>
    </div>
  </div>
</template>
