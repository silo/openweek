<script setup lang="ts">
import { inkColor } from '~~/shared/constants/colors'
import { pct } from '~~/shared/utils/stats'

/**
 * A completion-rate row: the track is this slice's own total, the fill is what got finished.
 *
 * Deliberately *not* scaled against the largest row. Untagged tasks outnumber every ink several
 * times over on a normal account, so a shared scale squashes all five inks into slivers and the
 * thing the section is actually asking — "do I finish what I mark jade?" — becomes unreadable.
 * The raw counts live in the caption.
 */
const props = defineProps<{
  label: string
  /** The finished part. */
  value: number
  /** The whole this row measures against. */
  total: number
  /** An ink *name*, so it resolves per theme. Falls back to the accent when absent. */
  color?: string | null
}>()

const fill = computed(() => pct(props.value, props.total))
const tint = computed(() => (props.color ? inkColor(props.color) : 'var(--ow-accent)'))
</script>

<template>
  <div class="flex items-center gap-3 text-[13px]">
    <span class="w-[104px] shrink-0 truncate text-ow-text">{{ label }}</span>

    <div
      class="h-[18px] min-w-0 flex-1 overflow-hidden rounded-[5px] bg-ow-track"
      role="progressbar"
      :aria-valuenow="fill"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`${label}: ${value} of ${total} done`"
    >
      <div class="h-full rounded-[5px] transition-[width]" :style="{ width: `${fill}%`, background: tint }" />
    </div>

    <span class="w-[58px] shrink-0 text-right text-ow-muted tabular-nums">
      {{ total ? `${value}/${total}` : '—' }}
    </span>
  </div>
</template>
