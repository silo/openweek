<script setup lang="ts">
// Renders the transient toasts from useToasts(). Mounted once in app.vue.
const { toasts, remove } = useToasts()

const typeClass: Record<string, string> = {
  error: 'alert-error',
  success: 'alert-success',
  info: '',
}
</script>

<template>
  <div class="toast toast-end z-50">
    <div v-for="t in toasts" :key="t.id" class="alert" :class="typeClass[t.type]">
      <span class="text-sm">{{ t.message }}</span>
      <button v-if="t.action" class="btn btn-ghost btn-xs" @click="t.action.run(); remove(t.id)">
        {{ t.action.label }}
      </button>
      <button class="btn btn-ghost btn-xs" aria-label="Dismiss" @click="remove(t.id)">✕</button>
    </div>
  </div>
</template>
