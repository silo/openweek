<script setup lang="ts">
import type { RecurrenceKind } from '#shared/utils/recurrence'
import { rruleToKind } from '#shared/utils/recurrence'
import { useBoardStore } from '~/stores/board'

// Shared modal for a task's title, time, recurrence, notes, and subtasks.
const store = useBoardStore()
const { openId, close } = useTaskEditor()

const task = computed(() => (openId.value ? store.tasksById[openId.value] ?? null : null))
const isTopLevel = computed(() => !!task.value && !task.value.parentId)
const isDateTask = computed(() => !!task.value?.date)
const subtasks = computed(() => (task.value ? store.subtasksOf(task.value.id) : []))

const repeatOptions: { value: RecurrenceKind | '', label: string }[] = [
  { value: '', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'wkdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]
const repeat = computed({
  get: () => rruleToKind(task.value?.recurrenceRule ?? null) ?? '',
  set: (v: RecurrenceKind | '') => { if (task.value) store.setRecurrence(task.value.id, v || null) },
})

const title = ref('')
const notes = ref('')
const time = ref('')
const newSub = ref('')

watch(task, (t) => {
  if (t) {
    title.value = t.title
    notes.value = t.notes ?? ''
    time.value = t.startTime ?? ''
  }
}, { immediate: true })

function save() {
  const t = task.value
  if (!t) {
    close()
    return
  }
  const nextTitle = title.value.trim()
  if (nextTitle && nextTitle !== t.title)
    store.setTitle(t.id, nextTitle)
  const nextNotes = notes.value.trim() || null
  if (nextNotes !== (t.notes ?? null))
    store.setNotes(t.id, nextNotes)
  const nextTime = time.value || null
  if (nextTime !== (t.startTime ?? null))
    store.setTime(t.id, nextTime)
  close()
}

function addSubtask() {
  const t = task.value
  const v = newSub.value.trim()
  if (!t || !v)
    return
  newSub.value = ''
  store.addSubtask(t.id, v)
}
</script>

<template>
  <dialog class="modal" :open="!!task">
    <div v-if="task" class="modal-box max-w-md border border-hairline">
      <input
        v-model="title"
        class="input input-bordered w-full font-mono font-medium"
        aria-label="Title"
        @keydown.enter.prevent="save"
      >

      <label class="mt-3 flex items-center gap-2 text-sm">
        <span class="opacity-60">◷ Time</span>
        <input v-model="time" type="time" class="input input-bordered input-sm w-32">
        <button v-if="time" type="button" class="btn btn-ghost btn-xs" @click="time = ''">clear</button>
      </label>

      <label v-if="isDateTask" class="mt-2 flex items-center gap-2 text-sm">
        <span class="opacity-60">↻ Repeat</span>
        <select v-model="repeat" class="select select-bordered select-sm w-40">
          <option v-for="o in repeatOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>

      <textarea
        v-model="notes"
        class="textarea textarea-bordered mt-3 h-28 w-full"
        placeholder="Notes…"
        aria-label="Notes"
      />

      <!-- Subtasks (top-level tasks only; depth-1) -->
      <div v-if="isTopLevel" class="mt-4">
        <div class="mb-1 font-mono text-[10px] uppercase tracking-widest opacity-50">
          Subtasks
        </div>
        <ul class="flex flex-col gap-1">
          <li v-for="s in subtasks" :key="s.id" class="group flex items-center gap-2 text-sm">
            <input type="checkbox" class="checkbox checkbox-xs" :checked="s.done" @change="store.toggleDone(s.id)">
            <span class="flex-1" :class="s.done ? 'line-through opacity-50' : ''">{{ s.title }}</span>
            <button type="button" class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100" aria-label="Delete subtask" @click="store.deleteTask(s.id)">✕</button>
          </li>
        </ul>
        <input
          v-model="newSub"
          type="text"
          class="mt-1 w-full bg-transparent px-1 py-1 text-sm placeholder:opacity-40 focus:outline-none"
          placeholder="+ Add subtask"
          @keydown.enter.prevent="addSubtask"
        >
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost btn-sm" @click="store.deleteTask(task.id); close()">
          Delete
        </button>
        <span class="flex-1" />
        <button class="btn btn-ghost btn-sm" @click="close">
          Cancel
        </button>
        <button class="btn btn-primary btn-sm" @click="save">
          Save
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button>close</button>
    </form>
  </dialog>
</template>
