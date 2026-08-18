<script setup lang="ts">
withDefaults(defineProps<{ direction?: 'left' | 'right', size?: number }>(), {
  direction: 'right',
  size: 15,
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="block"
  >
    <polyline :points="direction === 'left' ? '15 5 8 12 15 19' : '9 5 16 12 9 19'" />
  </svg>
</template>
