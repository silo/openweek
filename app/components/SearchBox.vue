<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import type { Task } from '~~/shared/schemas/task'

const emit = defineEmits<{ open: [Task] }>()

const week = useWeekStore()

const q = ref('')
const open = ref(false)
const input = ref<HTMLInputElement | null>(null)

const MAX_ROWS = 8

interface Row { task: Task, origin: string }

// Searches what is already loaded — this week and every list — matching the design's copy.
const rows = computed<Row[]>(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return []
  const out: Row[] = []
  for (const d of week.days) {
    for (const t of d.tasks) {
      if (out.length >= MAX_ROWS) return out
      if (t.title.toLowerCase().includes(needle)) {
        out.push({ task: t, origin: format(parseISO(d.date), 'EEE d') })
      }
    }
  }
  for (const l of week.lists) {
    for (const t of l.tasks) {
      if (out.length >= MAX_ROWS) return out
      if (t.title.toLowerCase().includes(needle)) out.push({ task: t, origin: l.name })
    }
  }
  return out
})

const showHint = computed(() => !q.value.trim())
const showEmpty = computed(() => !!q.value.trim() && rows.value.length === 0)

function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    input.value?.focus()
    open.value = true
  }
  if (e.key === 'Escape') open.value = false
}

function pick(row: Row) {
  emit('open', row.task)
  open.value = false
  q.value = ''
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <!-- The one part of the bar that gives way when the window is narrow: it can lose a third
       of its width and still be a search box, which no other control up here can. The width
       lives on the flex item itself — on the inner box the item still sizes to its content
       and nothing gives. -->
  <div class="relative w-[236px] min-w-[152px]">
    <div class="flex w-full items-center gap-2 rounded-[9px] bg-ow-sunken px-[11px] py-2">
      <span class="text-sm leading-none text-ow-muted" aria-hidden="true">⌕</span>
      <input
        ref="input"
        v-model="q"
        type="search"
        placeholder="Search tasks…"
        aria-label="Search tasks"
        class="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
        @focus="open = true"
        @blur="open = false"
      >
      <kbd class="text-[11.5px] text-ow-muted">⌘K</kbd>
    </div>

    <div
      v-if="open"
      class="absolute right-0 top-[42px] z-[70] flex w-[344px] flex-col gap-px rounded-[13px] border border-ow-border bg-ow-surface p-[7px] shadow-ow-2"
    >
      <p v-if="showHint" class="px-2.5 py-[9px] text-[13.5px] text-ow-muted">
        Type to search this week and every list.
      </p>
      <!-- mousedown, not click: the input's blur would close the panel first -->
      <button
        v-for="r in rows"
        :key="r.task.id"
        type="button"
        class="flex cursor-pointer items-baseline gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-left transition-colors hover:bg-ow-inset"
        @mousedown.prevent="pick(r)"
      >
        <span
          class="min-w-0 flex-1 truncate text-sm"
          :class="r.task.completedAt ? 'text-ow-done line-through' : 'text-ow-ink'"
        >{{ r.task.title }}</span>
        <span class="whitespace-nowrap text-xs text-ow-muted">{{ r.origin }}</span>
      </button>
      <p v-if="showEmpty" class="px-2.5 py-[9px] text-[13.5px] text-ow-muted">
        No matches.
      </p>
    </div>
  </div>
</template>
