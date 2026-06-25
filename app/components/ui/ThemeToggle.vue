<script setup lang="ts">
import { useColorMode } from '@vueuse/core'

// daisyUI themes via data-theme; syncs to system, with a manual override.
const mode = useColorMode({
  attribute: 'data-theme',
  modes: { light: 'paper', dark: 'paper-dark' },
  storageKey: 'openweek-theme',
})

function toggle() {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button type="button" class="btn btn-ghost btn-sm" aria-label="Toggle dark mode" @click="toggle">
    {{ mode === 'dark' ? '☾' : '☀' }}
  </button>
</template>
