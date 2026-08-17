<script setup lang="ts">
defineProps<{ rangeLabel: string, weekNumber: number }>()
const emit = defineEmits<{ prev: [], next: [], today: [], search: [] }>()
const week = useWeekStore()
</script>

<template>
  <header class="flex items-center gap-6 border-b border-ow-hairline px-7 pb-3.5 pt-4">
    <div class="flex items-center gap-2">
      <div class="h-[15px] w-[15px] rounded" style="background: var(--ow-accent);" />
      <span class="font-display text-[15px] font-semibold tracking-tight">openweek</span>
    </div>

    <div class="ml-1 flex items-baseline gap-3">
      <button class="cursor-pointer text-ow-ghost hover:text-ow-muted" aria-label="Previous week" @click="emit('prev')">‹</button>
      <h1 class="font-display text-xl font-semibold tracking-tight">{{ rangeLabel }}</h1>
      <button class="cursor-pointer text-ow-ghost hover:text-ow-muted" aria-label="Next week" @click="emit('next')">›</button>
      <button class="cursor-pointer rounded-full border border-ow-border px-2.5 py-0.5 font-display text-[11px] text-ow-faint hover:text-ow-muted" @click="emit('today')">Today</button>
      <span class="font-display text-[10px] tracking-widest text-ow-ghost">WEEK {{ weekNumber }}</span>
    </div>

    <div class="ml-auto flex items-center gap-4 font-display text-[11px] text-ow-muted">
      <span class="hidden sm:inline">{{ week.doneCount }} of {{ week.totalCount }} done</span>
      <button
        class="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-ow-border text-ow-muted hover:text-ow-ink"
        aria-label="Search"
        @click="emit('search')"
      >⌕</button>
      <NuxtLink
        to="/settings"
        class="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-ow-border text-ow-muted hover:text-ow-ink"
        aria-label="Settings"
      >
        ⚙
      </NuxtLink>
    </div>
  </header>
</template>
