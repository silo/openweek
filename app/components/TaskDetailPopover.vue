<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'
import { HIGHLIGHT } from '~~/shared/constants/colors'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ close: [] }>()
const week = useWeekStore()

const title = ref(props.task.title)
const note = ref(props.task.note ?? '')
const time = ref(props.task.timeOfDay?.slice(0, 5) ?? '')
const colors = Object.entries(HIGHLIGHT) as [keyof typeof HIGHLIGHT, string][]

function setColor(c: keyof typeof HIGHLIGHT | null) {
  week.updateTask(props.task.id, { highlightColor: c })
}
function saveTitle() {
  const v = title.value.trim()
  if (v && v !== props.task.title) week.updateTask(props.task.id, { title: v })
}
function saveNote() {
  week.updateTask(props.task.id, { note: note.value.trim() || null })
}
function saveTime() {
  week.updateTask(props.task.id, { timeOfDay: time.value || null })
}
async function remove() {
  await week.deleteTask(props.task.id)
  emit('close')
}
function dayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]
  return `${wd} ${d}`
}
function onMove(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  if (!v) return
  const [kind, val] = [v.slice(0, v.indexOf(':')), v.slice(v.indexOf(':') + 1)]
  week.moveTask(props.task.id, kind === 'date' ? { date: val } : { listId: val })
  emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-24"
    @click.self="emit('close')"
  >
    <div class="w-[340px] overflow-hidden rounded-xl border border-ow-border bg-ow-surface shadow-2xl">
      <div class="flex items-start gap-2.5 p-4">
        <button class="mt-0.5 cursor-pointer font-display text-ow-ghost" @click="week.toggleComplete(task.id)">
          {{ task.completedAt ? '✓' : '○' }}
        </button>
        <input
          v-model="title"
          class="flex-1 bg-transparent font-display text-sm font-medium focus:outline-none"
          @blur="saveTitle"
          @keydown.enter="saveTitle"
        >
        <button class="cursor-pointer text-ow-ghost hover:text-ow-muted" aria-label="Close" @click="emit('close')">×</button>
      </div>

      <div class="flex gap-1.5 px-4 pb-3">
        <button
          v-for="[name, hex] in colors"
          :key="name"
          class="h-[22px] w-[22px] cursor-pointer rounded-md"
          :style="{ background: hex, boxShadow: task.highlightColor === name ? '0 0 0 2px var(--ow-surface), 0 0 0 3.5px var(--ow-ink)' : 'none' }"
          :aria-label="`Highlight ${name}`"
          @click="setColor(name)"
        />
        <button
          class="flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-md border border-ow-border text-ow-ghost"
          aria-label="No highlight"
          @click="setColor(null)"
        >⊘</button>
      </div>

      <div class="border-t border-ow-hairline px-4 py-3">
        <label class="flex items-center gap-2 font-display text-[11.5px] text-ow-muted">
          <span class="w-4 text-center">◷</span>
          <input v-model="time" type="time" class="bg-transparent focus:outline-none" @change="saveTime">
        </label>
      </div>

      <div class="border-t border-ow-hairline px-4 py-3">
        <label class="flex items-center gap-2 font-display text-[11.5px] text-ow-muted">
          <span class="w-4 text-center">↪</span>
          <select class="flex-1 cursor-pointer bg-transparent focus:outline-none" @change="onMove">
            <option value="">Move to…</option>
            <optgroup label="This week">
              <option v-for="d in week.days" :key="d.date" :value="`date:${d.date}`">{{ dayLabel(d.date) }}</option>
            </optgroup>
            <optgroup label="Lists">
              <option v-for="l in week.lists" :key="l.id" :value="`list:${l.id}`">{{ l.name }}</option>
            </optgroup>
          </select>
        </label>
      </div>

      <div class="border-t border-ow-hairline px-4 py-3">
        <textarea
          v-model="note"
          rows="2"
          placeholder="Add a note…"
          class="w-full resize-none bg-transparent font-body text-[11.5px] italic text-ow-muted placeholder:text-ow-ghost focus:outline-none"
          @blur="saveNote"
        />
      </div>

      <div class="flex items-center border-t border-ow-hairline px-3 py-2.5 font-display text-[11px]">
        <button class="ml-auto cursor-pointer hover:opacity-80" style="color: #C49097;" @click="remove">🗑 Delete</button>
      </div>
    </div>
  </div>
</template>
