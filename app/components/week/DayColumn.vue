<script setup lang="ts">
import type { WeekDay } from '~/composables/useWeek'

/**
 * The reusable layout atom of the planner. Layout-agnostic: it makes no
 * assumption that it sits in a grid, so the same component powers the desktop
 * 7-col grid and the mobile single-day view. Task CRUD + the quick-add input
 * land in Phase 3; for now it renders an empty, hairline-ruled column.
 */
const props = defineProps<{
  day?: WeekDay
  title?: string
}>()

const heading = computed(() => props.title ?? props.day?.dayName ?? '')
</script>

<template>
  <section
    class="flex min-h-48 flex-col border-hairline"
    :aria-label="heading"
  >
    <header class="flex items-baseline justify-between px-3 py-2">
      <h2 class="font-accent text-xl leading-none" :class="{ 'text-primary': day?.isToday }">
        {{ heading }}
      </h2>
      <span v-if="day" class="text-sm tabular-nums opacity-60">
        {{ day.dayNumber }}
      </span>
    </header>

    <div class="flex-1 px-3 pb-3">
      <!-- Tasks render here in Phase 3. -->
      <slot />
    </div>
  </section>
</template>
