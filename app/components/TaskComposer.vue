<script setup lang="ts">
const props = defineProps<{ date: string }>()
const week = useWeekStore()
const title = ref('')
const inputEl = ref<HTMLInputElement>()

async function submit() {
  const value = title.value.trim()
  if (!value) return
  title.value = ''
  await week.createTask(props.date, value)
  await nextTick()
  inputEl.value?.focus()
}
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span class="font-display text-[12px] text-ow-ghost">○</span>
    <input
      ref="inputEl"
      v-model="title"
      class="w-full bg-transparent font-display text-[12px] text-ow-ink placeholder:text-ow-ghost focus:outline-none"
      placeholder="Write a task"
      @keydown.enter="submit"
    >
  </div>
</template>
