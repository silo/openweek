<script setup lang="ts">
// AGPL-3.0: a hosted instance must offer its source — surface a source link +
// version in the footer (see docs/self-hosting.md).
const version = '0.1.0'
const sourceUrl = 'https://github.com/openweek/openweek'
</script>

<template>
  <div class="flex h-full flex-col bg-base-100 text-base-content">
    <NuxtRouteAnnouncer />
    <main class="flex-1 overflow-hidden">
      <NuxtPage />
    </main>
    <footer class="flex items-center justify-end gap-1 border-t border-hairline px-4 py-1.5 text-xs opacity-50">
      <a :href="sourceUrl" target="_blank" rel="noopener" class="link link-hover">
        Source
      </a>
      <span>·</span>
      <span>Openweek v{{ version }} · AGPL-3.0</span>
    </footer>
  </div>
</template>
