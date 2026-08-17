<script setup lang="ts">
import type { SearchResult } from '~~/shared/schemas/search'

const emit = defineEmits<{ close: [], jump: [date: string], openList: [listId: string] }>()

const q = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(q, (val) => {
  clearTimeout(timer)
  if (!val.trim()) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    loading.value = true
    try {
      results.value = await apiFetch<SearchResult[]>(`/api/search?q=${encodeURIComponent(val.trim())}`)
    }
    finally {
      loading.value = false
    }
  }, 200)
})

function pick(r: SearchResult) {
  if (r.date) emit('jump', r.date)
  else if (r.listId) emit('openList', r.listId)
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-24" @click.self="emit('close')" @keydown.esc="emit('close')">
    <div class="w-full max-w-[440px] overflow-hidden rounded-xl border border-ow-border bg-ow-surface shadow-2xl">
      <div class="flex items-center gap-2 border-b border-ow-hairline px-4 py-3">
        <span class="text-ow-ghost">⌕</span>
        <input
          v-model="q"
          autofocus
          placeholder="Search tasks…"
          class="w-full bg-transparent font-display text-sm outline-none placeholder:text-ow-ghost"
        >
      </div>
      <div class="max-h-80 overflow-y-auto">
        <button
          v-for="r in results"
          :key="r.id"
          class="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-ow-sunken"
          @click="pick(r)"
        >
          <span class="truncate font-display text-[12.5px]" :class="r.completedAt ? 'text-ow-faint line-through' : 'text-ow-ink'">{{ r.title }}</span>
          <span class="ml-auto shrink-0 font-display text-[10px] text-ow-faint">{{ r.date ?? r.listName ?? '' }}</span>
        </button>
        <p v-if="q && !results.length && !loading" class="px-4 py-6 text-center font-display text-[12px] text-ow-faint">No matches</p>
      </div>
    </div>
  </div>
</template>
