<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'

const emit = defineEmits<{ openTask: [Task, DOMRect] }>()

const week = useWeekStore()

const creating = ref(false)
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)

/** Keep the grid even when there are only a couple of lists. */
const columns = computed(() => Math.max(week.lists.length, 4))

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

    <div
      class="grid items-start gap-2.5"
      :style="{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }"
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
