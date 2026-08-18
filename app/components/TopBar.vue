<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'

defineProps<{ rangeLabel: string, weekNumber: number }>()
const emit = defineEmits<{
  prev: []
  next: []
  today: []
  openTask: [Task]
}>()

const week = useWeekStore()
const settings = useSettingsStore()

const progressPct = computed(() =>
  week.totalCount > 0 ? Math.round((week.doneCount / week.totalCount) * 100) : 0,
)
const doneLabel = computed(() =>
  week.totalCount > 0 ? `${week.doneCount} of ${week.totalCount} done` : 'nothing planned',
)

const showWeekends = computed(() => settings.settings?.showWeekends ?? true)
function toggleWeekends() {
  settings.update({ showWeekends: !showWeekends.value })
}
</script>

<template>
  <header class="flex h-[62px] items-center gap-4 border-b border-ow-line pl-5 pr-[18px]">
    <BrandMark />

    <div class="h-[22px] w-px bg-ow-line" />

    <div class="flex items-center gap-[7px]">
      <!-- SVG rather than ‹ / › : the glyphs carry asymmetric side bearings and never sit
           centred in a square button, whatever the padding. -->
      <OwButton square title="Previous week" aria-label="Previous week" @click="emit('prev')">
        <ChevronIcon direction="left" />
      </OwButton>
      <OwButton square title="Next week" aria-label="Next week" @click="emit('next')">
        <ChevronIcon direction="right" />
      </OwButton>
      <OwButton @click="emit('today')">
        Today
      </OwButton>
    </div>

    <!-- items-center, not items-baseline: matching the 12.5px pill's baseline to the 23px
         title's pushed its box ~5px below every other control in the bar. -->
    <div class="flex items-center gap-[11px]">
      <h1 class="whitespace-nowrap font-display text-[23px] font-semibold tracking-[-0.02em] text-ow-ink">
        {{ rangeLabel }}
      </h1>
      <span class="rounded-md bg-ow-sunken px-[7px] py-[3px] text-[12.5px] font-semibold text-ow-secondary">
        W{{ weekNumber }}
      </span>
    </div>

    <div class="ml-0.5 flex items-center gap-[9px]">
      <div
        class="h-1.5 w-[92px] overflow-hidden rounded-[3px] bg-ow-hairline"
        role="progressbar"
        :aria-valuenow="progressPct"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="doneLabel"
      >
        <div class="h-full rounded-[3px] bg-ow-accent transition-[width]" :style="{ width: `${progressPct}%` }" />
      </div>
      <span class="whitespace-nowrap text-[13px] text-ow-text">{{ doneLabel }}</span>
    </div>

    <div class="flex-1" />

    <button
      type="button"
      title="Show or hide Saturday and Sunday"
      role="switch"
      :aria-checked="showWeekends"
      class="flex h-[34px] cursor-pointer items-center gap-2 rounded-[9px] border border-ow-border bg-ow-surface py-0 pl-2 pr-[11px] text-[13.5px] transition-colors hover:bg-ow-sunken"
      :class="showWeekends ? 'text-ow-title' : 'text-ow-ghost'"
      @click="toggleWeekends"
    >
      <OwSwitch :model-value="showWeekends" as="span" size="sm" />
      <span>Weekends</span>
    </button>
    <CalendarsMenu />
    <SearchBox @open="(t) => emit('openTask', t)" />
    <AccountMenu />
  </header>
</template>
