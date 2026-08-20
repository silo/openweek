<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'
import type { Container } from '~/composables/useTaskBoard'

/**
 * The rows of a day column or a list card.
 *
 * A `TransitionGroup` rather than a bare `v-for` so a ticked task can fold away instead of
 * blinking out. Only *completed* rows carry `ow-task-done`, and only that class has a leave
 * transition — a row leaving because it was dragged into another column, or because its
 * optimistic id was swapped for the real one, still goes instantly. See main.css.
 */
defineProps<{ tasks: Task[], container: Container }>()
const emit = defineEmits<{ open: [Task, DOMRect] }>()
</script>

<template>
  <TransitionGroup name="ow-task" tag="div" class="flex flex-col">
    <div
      v-for="t in tasks"
      :key="t.id"
      class="ow-task-row"
      :class="t.completedAt && 'ow-task-done'"
    >
      <TaskItem :task="t" :container="container" @open="(task, r) => emit('open', task, r)" />
    </div>
  </TransitionGroup>
</template>
