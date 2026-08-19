<script setup lang="ts">
/** The "N done" / "Hide N done" line at the foot of a day column or list card. */
defineProps<{ label: string, expanded: boolean }>()
</script>

<template>
  <button
    type="button"
    class="mb-2 cursor-pointer self-start rounded-[7px] border-none bg-transparent px-2 py-1 text-[12.5px] text-ow-muted transition-colors hover:bg-ow-inset hover:text-ow-title"
    :aria-expanded="expanded"
  >
    {{ label }}
  </button>
</template>
