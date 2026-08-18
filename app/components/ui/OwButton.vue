<script setup lang="ts">
/** The bordered pill button the design uses across the toolbar and menus. */
withDefaults(defineProps<{
  /** `ghost` drops the border, `accent` fills with the accent colour. */
  variant?: 'default' | 'ghost' | 'accent'
  size?: 'sm' | 'md'
  active?: boolean
  square?: boolean
}>(), { variant: 'default', size: 'md', active: false, square: false })
</script>

<template>
  <button
    type="button"
    class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[9px] transition-colors"
    :class="[
      size === 'sm' ? 'h-[26px] px-[9px] text-[12.5px]' : 'h-[30px] text-[13.5px]',
      size === 'md' && (square ? 'w-[30px]' : 'px-3'),
      variant === 'ghost' ? 'border-none bg-transparent' : 'border',
      variant === 'accent'
        ? 'border-ow-accent bg-ow-accent text-ow-accent-content'
        : 'border-ow-border bg-ow-surface text-ow-strong hover:bg-ow-sunken hover:text-ow-ink',
      active && variant !== 'accent' && 'bg-ow-sunken text-ow-ink',
    ]"
  >
    <slot />
  </button>
</template>
