<script setup lang="ts">
import type { Scope } from '~/composables/useTaskDnd'
import type { Task } from '#shared/types/task'
import { appendPosition, positionForReorder } from '#shared/utils/ordering'
import { useBoardStore } from '~/stores/board'

// The non-drag equivalent of every drag action (a v1 a11y requirement): reorder
// within the column, or move to another day / list. Keyboard-navigable.
const props = defineProps<{ task: Task }>()

const store = useBoardStore()
const { days } = useWeek()

const scope = computed<Scope>(() =>
  props.task.listId != null ? { listId: props.task.listId } : { date: props.task.date! })

const siblings = computed(() =>
  props.task.listId != null ? store.tasksForList(props.task.listId) : store.tasksForDate(props.task.date!))
const index = computed(() => siblings.value.findIndex(t => t.id === props.task.id))
const canUp = computed(() => index.value > 0)
const canDown = computed(() => index.value >= 0 && index.value < siblings.value.length - 1)

function reorder(dir: 'up' | 'down') {
  const pos = positionForReorder(siblings.value, props.task.id, dir)
  if (pos != null)
    store.moveTask(props.task.id, scope.value, pos)
}

function moveToDate(iso: string) {
  store.moveTask(props.task.id, { date: iso }, appendPosition(store.tasksForDate(iso)))
}

function moveToList(listId: string) {
  store.moveTask(props.task.id, { listId }, appendPosition(store.tasksForList(listId)))
}
</script>

<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-xs px-1" aria-label="Move task">⋯</div>
    <ul tabindex="0" class="dropdown-content menu z-20 max-h-80 w-44 flex-nowrap overflow-auto rounded-box bg-base-100 p-2 text-sm shadow">
      <li><button type="button" :disabled="!canUp" @click="reorder('up')">↑ Move up</button></li>
      <li><button type="button" :disabled="!canDown" @click="reorder('down')">↓ Move down</button></li>
      <li class="menu-title px-2">Move to day</li>
      <li v-for="d in days" :key="d.iso">
        <button type="button" :disabled="task.date === d.iso" @click="moveToDate(d.iso)">
          {{ d.dayName }} {{ d.dayNumber }}
        </button>
      </li>
      <template v-if="store.sortedLists.length">
        <li class="menu-title px-2">Move to list</li>
        <li v-for="l in store.sortedLists" :key="l.id">
          <button type="button" :disabled="task.listId === l.id" @click="moveToList(l.id)">{{ l.name }}</button>
        </li>
      </template>
    </ul>
  </div>
</template>
