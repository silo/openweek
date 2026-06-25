<script setup lang="ts">
import { useWeek } from '~/composables/useWeek'

// Per-user week start is wired in Phase 3; default Monday for now.
const { days, rangeLabel, next, prev, thisWeek } = useWeek(1)
</script>

<template>
  <div class="flex h-full flex-col">
    <header class="flex items-center justify-between border-b border-hairline px-4 py-3">
      <h1 class="font-accent text-3xl">
        Openweek
      </h1>
      <div class="flex items-center gap-2">
        <span class="mr-2 text-sm opacity-70">{{ rangeLabel }}</span>
        <button class="btn btn-sm btn-ghost" aria-label="Previous week" @click="prev">
          ‹
        </button>
        <button class="btn btn-sm btn-ghost" @click="thisWeek">
          Today
        </button>
        <button class="btn btn-sm btn-ghost" aria-label="Next week" @click="next">
          ›
        </button>
      </div>
    </header>

    <!-- Desktop: 7 day columns + Someday, hairline rules between. -->
    <div class="grid flex-1 grid-cols-1 divide-y divide-hairline md:grid-cols-8 md:divide-x md:divide-y-0">
      <DayColumn
        v-for="day in days"
        :key="day.iso"
        :day="day"
      />
      <DayColumn title="Someday" />
    </div>
  </div>
</template>
