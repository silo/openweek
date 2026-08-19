<script setup lang="ts">
/** The accent rule showing where a dragged task will land. */
</script>

<template>
  <div
    class="ow-drop-line mx-1 my-[3px] h-[3px] rounded-sm"
    style="background: var(--ow-accent);"
    aria-hidden="true"
  />
</template>

<style scoped>
.ow-drop-line {
  transform-origin: left center;
  animation: ow-drop-line 140ms ease-out;
}

@keyframes ow-drop-line {
  from { opacity: 0; transform: scaleX(0.6); }
  to { opacity: 1; transform: scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .ow-drop-line { animation: none; }
}
</style>
