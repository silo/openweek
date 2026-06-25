<script setup lang="ts">
import { useBoardStore } from '~/stores/board'

// Scope is a day ({date}) or a list ({listId}). Enter creates and keeps focus
// for rapid entry (see docs/design.md — fast keyboard entry is the point).
const props = defineProps<{ scope: { date: string } | { listId: string } }>()

const store = useBoardStore()
const title = ref('')

async function add() {
  const t = title.value.trim()
  if (!t)
    return
  title.value = ''
  await store.createTask(props.scope, t)
}
</script>

<template>
  <input
    v-model="title"
    type="text"
    class="w-full bg-transparent px-1.5 py-1 text-sm placeholder:opacity-40 focus:outline-none"
    placeholder="+ Add task"
    @keydown.enter.prevent="add"
  >
</template>
