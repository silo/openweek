<script setup lang="ts">
/** Uses the design's ow-spin keyframe, so reduced-motion settles it to a static ring. */
withDefaults(defineProps<{ size?: number }>(), { size: 13 })
</script>

<template>
  <span
    class="ow-spinner inline-block flex-none rounded-full border-2 border-current"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>

<style scoped>
.ow-spinner {
  border-top-color: transparent;
  border-right-color: transparent;
  opacity: 0.75;
  animation: ow-spin 0.7s linear infinite;
}
</style>
