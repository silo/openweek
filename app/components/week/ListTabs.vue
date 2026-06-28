<script setup lang="ts">
import { useActiveList } from '~/composables/useActiveList'
import { useBoardStore } from '~/stores/board'

const store = useBoardStore()
const { active, select } = useActiveList()

function count(listId: string) {
  return store.tasksForList(listId).filter(t => !t.parentId).length
}
</script>

<template>
  <div class="flex items-stretch gap-1 overflow-x-auto border-t border-hairline px-5">
    <button
      v-for="l in store.sortedLists"
      :key="l.id"
      type="button"
      class="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 font-mono text-xs"
      :class="active?.id === l.id ? 'border-b-2 border-accent font-medium text-base-content' : 'border-b-2 border-transparent text-base-content/55 hover:text-base-content'"
      style="margin-bottom:-1px"
      @click="select(l.id)"
    >
      <span class="size-2.5 rounded-sm" :style="{ background: l.color || 'var(--color-hairline)' }" />
      <span>{{ l.name }}</span>
      <span class="text-base-content/40">{{ count(l.id) }}</span>
    </button>
    <AddList />
  </div>
</template>
