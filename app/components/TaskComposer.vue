<script setup lang="ts">
import type { Container } from '~/composables/useTaskBoard'

const props = defineProps<{ container: Container, label?: string }>()

const week = useWeekStore()

const adding = ref(false)
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)

async function start() {
  adding.value = true
  await nextTick()
  input.value?.focus()
}

/** Enter keeps the composer open so several tasks can be added in a row; Esc closes it. */
function commit(keepOpen: boolean) {
  const title = draft.value.trim()
  draft.value = ''
  if (title) week.createTask(props.container, title)
  adding.value = keepOpen
  if (keepOpen) nextTick(() => input.value?.focus())
}
</script>

<template>
  <input
    v-if="adding"
    ref="input"
    v-model="draft"
    type="text"
    placeholder="New task…"
    class="mt-0.5 w-full rounded-[9px] border bg-ow-surface px-2.5 py-2 text-[14.5px] outline-none"
    style="border-color: var(--ow-accent-edge);"
    @keydown.enter.prevent="commit(true)"
    @keydown.esc.prevent="adding = false; draft = ''"
    @blur="commit(false)"
  >
  <button
    v-else
    type="button"
    class="mt-0.5 cursor-pointer rounded-[9px] border-none bg-transparent px-[9px] py-[7px] text-left text-sm text-ow-done transition-colors hover:bg-ow-inset hover:text-ow-ink"
    @click="start"
  >
    {{ label ?? '＋ Add' }}
  </button>
</template>
