<script setup lang="ts">
/**
 * Vertical bars — the weekday shape, the hour-of-day shape, and the week-over-week trend.
 *
 * When a bar carries `of`, the column is drawn to `of` in the track colour and filled to
 * `value` in the accent, so planned-versus-closed reads as one column rather than two.
 */
const props = defineProps<{
  bars: readonly { key: string, label: string, value: number, of?: number }[]
  /** Rendered under every Nth bar; the hour chart would otherwise be an unreadable ruler. */
  labelEvery?: number
  height?: number
}>()

const max = computed(() => Math.max(1, ...props.bars.map(b => b.of ?? b.value)))
const h = computed(() => props.height ?? 108)
const every = computed(() => props.labelEvery ?? 1)

const describe = (b: { label: string, value: number, of?: number }) =>
  b.of === undefined ? `${b.label}: ${b.value}` : `${b.label}: ${b.value} of ${b.of} done`

/**
 * Column height, floored just above zero so an empty bucket still reads as a nought sitting on
 * the axis. Without the floor a quiet day renders as nothing at all, which looks like a column
 * that failed rather than a day with nothing planned.
 */
const heightPct = (b: { value: number, of?: number }) =>
  Math.max(((b.of ?? b.value) / max.value) * 100, 1.5)
</script>

<template>
  <div class="flex items-end justify-center gap-[3px]" :style="{ height: `${h}px` }">
    <!-- Capped so a four-column range does not render as three slabs; a no-op once the bars
         are narrower than the cap, which is every chart from a dozen columns up. -->
    <div
      v-for="(b, i) in bars"
      :key="b.key"
      class="flex h-full min-w-0 max-w-[90px] flex-1 flex-col justify-end gap-1.5"
    >
      <div
        class="relative w-full rounded-[3px] bg-ow-track transition-[height]"
        role="img"
        :aria-label="describe(b)"
        :title="describe(b)"
        :style="{ height: `${heightPct(b)}%` }"
      >
        <div
          class="absolute bottom-0 left-0 w-full rounded-[3px] bg-ow-accent transition-[height]"
          :style="{ height: `${((b.of ?? b.value) === 0 ? 0 : (b.value / (b.of ?? b.value)) * 100)}%` }"
        />
      </div>
      <!-- A label per bar is short enough to centre and clip. Sparse labels are dates, which are
           far wider than the column they sit under, so they hang off to the right like axis ticks
           instead of being truncated to "1…". -->
      <span
        class="h-[13px] text-[10.5px] leading-none text-ow-faint tabular-nums"
        :class="every === 1 ? 'truncate text-center' : 'whitespace-nowrap text-left'"
        aria-hidden="true"
      >{{ i % every === 0 ? b.label : '' }}</span>
    </div>
  </div>
</template>
