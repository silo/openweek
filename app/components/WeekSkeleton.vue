<script setup lang="ts">
withDefaults(defineProps<{ columns?: number }>(), { columns: 7 })

// Rows per column, so the skeleton reads as a week rather than a uniform block.
const ROWS = [2, 3, 1, 2, 3, 1, 2]
</script>

<template>
  <div class="grid gap-px bg-ow-line" :style="{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }">
    <div
      v-for="c in columns"
      :key="c"
      class="flex min-h-[520px] flex-col bg-ow-surface px-[11px] pb-4 pt-3.5"
    >
      <div class="flex items-baseline gap-2 px-0.5">
        <span class="ow-shimmer h-[22px] w-8 rounded-md" />
        <span class="ow-shimmer h-3 w-8 rounded" />
      </div>
      <div class="my-[11px] h-px bg-ow-line" />
      <div
        v-for="r in ROWS[(c - 1) % ROWS.length]"
        :key="r"
        class="ow-shimmer mb-2 h-[38px] rounded-[9px]"
      />
    </div>
  </div>
</template>

<style scoped>
.ow-shimmer {
  background: linear-gradient(
    90deg,
    var(--ow-sunken) 0%,
    var(--ow-inset) 40%,
    var(--ow-sunken) 80%
  );
  background-size: 260px 100%;
  animation: ow-shimmer 1.2s linear infinite;
}
</style>
