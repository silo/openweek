<script setup lang="ts">
import { useBoardStore } from '~/stores/board'

const store = useBoardStore()
const name = ref('')
const adding = ref(false)
const inputEl = ref<HTMLInputElement>()

function begin() {
  adding.value = true
  nextTick(() => inputEl.value?.focus())
}

async function add() {
  const n = name.value.trim()
  if (!n) {
    adding.value = false
    return
  }
  name.value = ''
  adding.value = false
  await store.createList(n)
}
</script>

<template>
  <div class="px-3 py-2">
    <input
      v-if="adding"
      ref="inputEl"
      v-model="name"
      type="text"
      class="w-full bg-transparent text-sm focus:outline-none"
      placeholder="List name…"
      @keydown.enter.prevent="add"
      @keydown.esc.prevent="adding = false"
      @blur="add"
    >
    <button v-else type="button" class="text-sm opacity-40 hover:opacity-100" @click="begin">
      + Add list
    </button>
  </div>
</template>
