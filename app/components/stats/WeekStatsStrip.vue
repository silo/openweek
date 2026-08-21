<script setup lang="ts">
import { pct } from '~~/shared/utils/stats'

/**
 * A quiet line above the grid. Deliberately does not repeat the toolbar's "3 of 12 done" —
 * it carries only what the week itself cannot know: the streak, and how the last four weeks
 * went. Asks for `scope=summary` so a week load does not pay for the whole Stats page.
 */
const stats = useStatsStore()

onMounted(() => {
  // A failure here must not take the week down with it; the strip simply stays away.
  stats.loadSummary().catch(() => {})
})

const s = computed(() => stats.summary)
const reach = computed(() => pct(s.value?.closedOfPlanned ?? 0, s.value?.planned ?? 0))
const show = computed(() => !!s.value && (s.value.planned > 0 || s.value.closed > 0))
</script>

<template>
  <NuxtLink
    v-if="show && s"
    to="/stats"
    class="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-ow-line px-[18px] py-2 text-[13px] text-ow-muted no-underline transition-colors hover:bg-ow-sunken"
  >
    <template v-if="s.currentStreak > 0">
      <span class="text-ow-text tabular-nums">{{ s.currentStreak }}</span>
      <span>{{ s.currentStreak === 1 ? 'day in a row' : 'days in a row' }} with something finished</span>
      <span class="text-ow-ghost" aria-hidden="true">·</span>
    </template>

    <template v-if="s.planned > 0">
      <span class="text-ow-text tabular-nums">{{ reach }}%</span>
      <span>of what you planned over the last four weeks</span>
    </template>

    <div class="flex-1" />
    <span class="whitespace-nowrap text-ow-faint">Stats ›</span>
  </NuxtLink>
</template>
