<script setup lang="ts">
/** The bordered pill button the design uses across the toolbar and menus. */
withDefaults(defineProps<{
  /** `accent` fills with the accent colour. */
  variant?: 'default' | 'accent'
  size?: 'sm' | 'md'
  square?: boolean
  /** Swaps the label for a spinner and blocks input. */
  loading?: boolean
  disabled?: boolean
}>(), {
  variant: 'default',
  size: 'md',
  square: false,
  loading: false,
  disabled: false,
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[9px] transition-colors disabled:cursor-default disabled:opacity-60"
    :class="[
      size === 'sm' ? 'h-[26px] text-[12.5px]' : 'h-[30px] text-[13.5px]',
      square
        ? (size === 'sm' ? 'w-[26px]' : 'w-[30px]')
        : (size === 'sm' ? 'px-[9px]' : 'px-3'),
      variant === 'accent'
        ? 'border border-ow-accent bg-ow-accent text-ow-accent-content'
        : 'border border-ow-border bg-ow-surface text-ow-strong hover:bg-ow-sunken hover:text-ow-ink',
    ]"
  >
    <OwSpinner v-if="loading" :size="size === 'sm' ? 11 : 13" />
    <slot />
  </button>
</template>
