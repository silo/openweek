<script setup lang="ts">
/** A row of mutually exclusive options — the shape every Appearance setting uses. */
defineProps<{
  options: readonly { v: string | number, label: string, style?: Record<string, string> }[]
  modelValue: string | number
}>()

defineEmits<{ 'update:modelValue': [string | number] }>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="o in options"
      :key="o.v"
      type="button"
      :aria-pressed="modelValue === o.v"
      class="cursor-pointer rounded-[9px] border px-3.5 py-2 text-[13.5px] transition-colors"
      :class="modelValue === o.v
        ? 'border-ow-select-edge bg-ow-select-bg font-semibold text-ow-ink'
        : 'border-ow-border bg-ow-surface text-ow-text hover:bg-ow-sunken'"
      :style="o.style"
      @click="$emit('update:modelValue', o.v)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
