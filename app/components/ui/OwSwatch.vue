<script setup lang="ts">
/**
 * A colour square with a selection ring. Used by the task popover, the list menu, the
 * accent picker and the per-calendar colour row — the ring geometry had already drifted
 * between hand-written copies.
 */
withDefaults(defineProps<{
  /** Any CSS colour, usually from `inkColor()` / `accentVar()`. */
  color: string
  label: string
  selected?: boolean
  size?: number
}>(), { selected: false, size: 22 })
</script>

<template>
  <button
    type="button"
    :title="label"
    :aria-label="label"
    :aria-pressed="selected"
    class="cursor-pointer rounded-[7px] border-none p-0"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      boxShadow: selected ? '0 0 0 2px var(--ow-surface), 0 0 0 3.5px var(--ow-ink)' : 'none',
    }"
  />
</template>
