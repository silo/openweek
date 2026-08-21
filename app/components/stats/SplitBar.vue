<script setup lang="ts">
import { pct } from '~~/shared/utils/stats'

/**
 * One bar cut into named parts — the early / on-the-day / late split.
 *
 * Every segment carries its own label underneath, because colour alone is not allowed to be
 * the signal, and the three inks would otherwise need a legend to mean anything.
 */
const props = defineProps<{
  parts: readonly { key: string, label: string, value: number, color: string }[]
}>()

const total = computed(() => props.parts.reduce((sum, p) => sum + p.value, 0))
</script>

<template>
  <div>
    <div class="flex h-[22px] gap-[3px] overflow-hidden rounded-[6px]">
      <div
        v-for="p in parts"
        :key="p.key"
        class="h-full rounded-[4px] transition-[width]"
        :style="{ width: `${Math.max(pct(p.value, total), p.value > 0 ? 2 : 0)}%`, background: p.color }"
        role="progressbar"
        :aria-valuenow="pct(p.value, total)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${p.label}: ${p.value}`"
      />
    </div>

    <div class="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
      <span v-for="p in parts" :key="p.key" class="flex items-center gap-2 text-[12.5px] text-ow-muted">
        <span class="h-2.5 w-2.5 shrink-0 rounded-[3px]" :style="{ background: p.color }" aria-hidden="true" />
        <span class="text-ow-text tabular-nums">{{ p.value }}</span>
        <span>{{ p.label }}</span>
      </span>
    </div>
  </div>
</template>
