<script setup lang="ts">
/** One headline figure. The number is a slot so a tile can set its own unit and emphasis. */
defineProps<{ label: string, hint?: string }>()
</script>

<template>
  <div class="rounded-xl border border-ow-border bg-ow-surface px-4 py-3.5">
    <div class="text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
      {{ label }}
    </div>
    <div class="mt-2 font-display text-[27px] font-semibold leading-none tracking-[-0.02em] text-ow-ink tabular-nums">
      <slot />
    </div>
    <p v-if="hint" class="mt-2 text-[12.5px] leading-snug text-ow-muted">
      {{ hint }}
    </p>
  </div>
</template>
