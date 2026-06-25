<script setup lang="ts">
import type { WeekDay } from '~/composables/useWeek'
import { useBoardStore } from '~/stores/board'

/**
 * The reusable layout atom — layout-agnostic (no grid assumption), so it powers
 * the desktop 7-col grid, the Someday lists, and the mobile single-day view.
 * Renders tasks for its scope (a date or a list) and a focus-first quick-add.
 */
const props = defineProps<{
  day?: WeekDay
  list?: { id: string, name: string }
}>()

const store = useBoardStore()

const scope = computed(() =>
  props.list ? { listId: props.list.id } : { date: props.day!.iso })

const heading = computed(() => props.list?.name ?? props.day?.dayName ?? '')

const tasks = computed(() =>
  props.list ? store.tasksForList(props.list.id) : store.tasksForDate(props.day!.iso))
</script>

<template>
  <section class="flex min-h-48 flex-col border-hairline" :aria-label="heading">
    <header class="flex items-baseline justify-between px-3 pb-1 pt-2">
      <h2 class="font-accent text-xl leading-none" :class="{ 'text-primary': day?.isToday }">
        {{ heading }}
      </h2>
      <div class="flex items-center gap-1">
        <span v-if="day" class="text-sm tabular-nums opacity-60">{{ day.dayNumber }}</span>
        <button
          v-if="list"
          type="button"
          class="btn btn-ghost btn-xs px-1 opacity-40 hover:opacity-100"
          :aria-label="`Delete list ${list.name}`"
          @click="store.deleteList(list.id)"
        >
          ✕
        </button>
      </div>
    </header>

    <div class="flex flex-1 flex-col gap-0.5 px-1.5 pb-2">
      <TaskRow v-for="task in tasks" :key="task.id" :task="task" />
      <QuickAdd :scope="scope" />
    </div>
  </section>
</template>
