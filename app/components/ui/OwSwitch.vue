<script setup lang="ts">
/** The pill toggle used by the weekends button, the calendars menu and Settings. */
const props = withDefaults(defineProps<{
  modelValue: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Rendered as a plain span when the switch sits inside another button. */
  as?: 'button' | 'span'
  label?: string
}>(), { size: 'md', as: 'button', label: undefined })

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

// Track / knob geometry, taken from the design's three switch sizes.
const DIMS = {
  sm: { w: 28, h: 16, knob: 11 },
  md: { w: 34, h: 20, knob: 15 },
  lg: { w: 36, h: 22, knob: 16 },
} as const

const d = computed(() => DIMS[props.size])
const inset = computed(() => (d.value.h - d.value.knob) / 2)
const offset = computed(() => (props.modelValue ? d.value.w - d.value.knob - inset.value : inset.value))
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? 'button' : undefined"
    :role="as === 'span' ? undefined : 'switch'"
    :aria-checked="as === 'span' ? undefined : modelValue"
    :aria-label="label"
    class="relative inline-block flex-none rounded-full border-none p-0 transition-colors"
    :class="as === 'button' && 'cursor-pointer'"
    :style="{
      width: `${d.w}px`,
      height: `${d.h}px`,
      background: modelValue ? 'var(--ow-accent)' : 'var(--ow-track)',
    }"
    @click="as === 'button' && emit('update:modelValue', !modelValue)"
  >
    <span
      class="absolute rounded-full transition-[left]"
      :style="{
        top: `${inset}px`,
        left: `${offset}px`,
        width: `${d.knob}px`,
        height: `${d.knob}px`,
        background: 'var(--ow-surface)',
      }"
    />
  </component>
</template>
