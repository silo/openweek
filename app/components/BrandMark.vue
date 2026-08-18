<script setup lang="ts">
/** Five bars of falling height — a week at a glance — beside the wordmark. */
withDefaults(defineProps<{ showWordmark?: boolean }>(), { showWordmark: true })

// height in px, colour token; the last two sit quiet so the mark reads as "days left".
const BARS = [
  { h: 14, c: 'var(--ow-accent)' },
  { h: 9, c: 'var(--ow-brand-2)' },
  { h: 12, c: 'var(--ow-brand-3)' },
  { h: 7, c: 'var(--ow-track)' },
  { h: 10, c: 'var(--ow-track)' },
]
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div class="flex items-end gap-[2px]" aria-hidden="true">
      <div
        v-for="(b, i) in BARS"
        :key="i"
        class="w-[5px] rounded-[1.5px]"
        :style="{ height: `${b.h}px`, background: b.c }"
      />
    </div>
    <div
      v-if="showWordmark"
      class="font-brand text-[19px] font-semibold tracking-[-0.02em] text-ow-ink"
    >
      Openweek
    </div>
  </div>
</template>
