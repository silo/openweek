<script setup lang="ts">
import { useActiveList } from '~/composables/useActiveList'
import { useBoardStore } from '~/stores/board'

// The bottom drawer: the active list's items in a 2-row horizontal-scroll grid,
// plus a quick-add, plus the list tabs. The grid body is a drop target so tasks
// can be dragged into the list.
const store = useBoardStore()
const { active } = useActiveList()

const items = computed(() => (active.value ? store.tasksForList(active.value.id).filter(t => !t.parentId) : []))
const scope = computed(() => (active.value ? { listId: active.value.id } : null))

const dropEl = ref<HTMLElement>()
useDropColumn(dropEl, () => scope.value ?? { listId: '' })

defineExpose({ dropEl })
</script>

<template>
  <div class="border-t border-hairline bg-base-200/40">
    <div v-if="active" class="px-6 pb-2 pt-3">
      <div class="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-widest text-base-content/45">
        <span class="uppercase">{{ active.name }}</span>
        <span class="text-base-content/35">{{ items.length }} items</span>
      </div>
      <div
        ref="dropEl"
        class="grid min-h-16 grid-flow-col grid-rows-2 gap-x-7 gap-y-0.5 overflow-x-auto pb-1"
        style="grid-auto-columns: minmax(13rem, 1fr)"
      >
        <TaskRow v-for="task in items" :key="task.id" :task="task" />
        <QuickAdd v-if="scope" :scope="scope" />
      </div>
    </div>
    <div v-else class="px-6 py-4 font-mono text-xs text-base-content/40">
      No lists yet.
    </div>

    <ListTabs />
  </div>
</template>
