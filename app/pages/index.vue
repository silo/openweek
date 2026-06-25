<script setup lang="ts">
// The week grid depends on the client clock/timezone, so render it client-side
// to avoid an SSR/client hydration mismatch (also a Phase 4 DnD requirement).
</script>

<template>
  <ClientOnly>
    <WeekGrid />
    <template #fallback>
      <div class="grid h-full place-items-center text-sm opacity-50">
        Loading week…
      </div>
    </template>
  </ClientOnly>
</template>
