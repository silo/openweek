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
const showWeekends = computed(() => settings.settings?.showWeekends ?? true)
function toggleWeekends() {
  settings.update({ showWeekends: !showWeekends.value })
}
const showLists = computed(() => settings.settings?.showLists ?? true)
function toggleLists() {
  settings.update({ showLists: !showLists.value })
}

/** The two "what is on screen" switches share a shell, so they share their styling too. */
const toggleClass = 'flex cursor-pointer items-center gap-2 border-none bg-transparent py-0 pl-2 pr-[11px] text-[13.5px] transition-colors hover:bg-ow-sunken'
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
        :aria-label="week.doneLabel"
      >
        <div class="h-full rounded-[3px] bg-ow-accent transition-[width]" :style="{ width: `${progressPct}%` }" />
      </div>
      <span class="whitespace-nowrap text-[13px] text-ow-text">{{ week.doneLabel }}</span>
    </div>

    <div class="flex-1" />

    <!-- Both switches answer "what is on screen", so they share one shell — as two
         free-standing buttons they pushed the bar past its own width at 1024. -->
    <div class="flex h-[34px] items-stretch overflow-hidden rounded-[9px] border border-ow-border bg-ow-surface">
      <button
        type="button"
        title="Show or hide Saturday and Sunday"
        role="switch"
        :aria-checked="showWeekends"
        :class="[toggleClass, showWeekends ? 'text-ow-title' : 'text-ow-ghost']"
        @click="toggleWeekends"
      >
        <OwSwitch :model-value="showWeekends" as="span" size="sm" />
        <span>Weekends</span>
      </button>

      <span class="my-[6px] w-px flex-none bg-ow-border" aria-hidden="true" />

      <button
        type="button"
        title="Show or hide the lists under the week"
        role="switch"
        :aria-checked="showLists"
        :class="[toggleClass, showLists ? 'text-ow-title' : 'text-ow-ghost']"
        @click="toggleLists"
      >
        <OwSwitch :model-value="showLists" as="span" size="sm" />
        <span>Lists</span>
      </button>
    </div>
    <CalendarsMenu />
    <SearchBox @open="(t) => emit('openTask', t)" />
    <AccountMenu />
  </header>
</template>
