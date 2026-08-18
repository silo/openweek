<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'

const emit = defineEmits<{ openTask: [Task, DOMRect] }>()

const week = useWeekStore()

const creating = ref(false)
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)

async function start() {
  creating.value = true
  await nextTick()
  input.value?.focus()
}
function commit() {
  const name = draft.value.trim()
  creating.value = false
  draft.value = ''
  if (name) week.createList(name)
}
</script>

<template>
  <section class="rounded-b-2xl border-t border-ow-line bg-ow-shell px-4 pb-4 pt-3.5">
    <div class="flex items-center gap-3 px-0.5 pb-[11px]">
      <h2 class="text-[12.5px] font-semibold tracking-[0.06em] text-ow-secondary">
        LISTS
      </h2>
      <p class="text-[13px] text-ow-muted">
        not tied to a day — drag any card up into the week
      </p>
      <div class="flex-1" />
      <input
        v-if="creating"
        ref="input"
        v-model="draft"
        type="text"
        placeholder="List name…"
        aria-label="New list name"
        class="w-[180px] rounded-lg border bg-ow-surface px-2.5 py-1.5 text-[13.5px] outline-none"
        style="border-color: var(--ow-accent-edge);"
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="creating = false; draft = ''"
        @blur="commit"
      >
      <OwButton v-else size="sm" @click="start">
        ＋ New list
      </OwButton>
    </div>

    <!-- One card per row on narrow screens. On the grid, cards hold a minimum width and the
         rail scrolls sideways once they no longer fit, rather than squeezing to nothing. -->
    <div
      class="grid grid-cols-1 items-start gap-2.5 lg:auto-cols-[minmax(var(--ow-list-min),1fr)] lg:grid-flow-col lg:grid-cols-none lg:overflow-x-auto lg:pb-1"
      style="--ow-list-min: 264px"
    >
      <ListCard
        v-for="l in week.lists"
        :key="l.id"
        :list="l"
        @open-task="(t, r) => emit('openTask', t, r)"
      />
    </div>
  </section>
</template>
