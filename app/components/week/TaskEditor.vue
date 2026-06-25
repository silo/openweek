<script setup lang="ts">
import { useBoardStore } from '~/stores/board'

// Single shared modal for a task's notes + title. Opened via useTaskEditor().
const store = useBoardStore()
const { openId, close } = useTaskEditor()

const task = computed(() => (openId.value ? store.tasksById[openId.value] ?? null : null))

const title = ref('')
const notes = ref('')

watch(task, (t) => {
  if (t) {
    title.value = t.title
    notes.value = t.notes ?? ''
  }
}, { immediate: true })

function save() {
  const t = task.value
  if (!t) {
    close()
    return
  }
  const nextTitle = title.value.trim()
  if (nextTitle && nextTitle !== t.title)
    store.setTitle(t.id, nextTitle)
  const nextNotes = notes.value.trim() || null
  if (nextNotes !== (t.notes ?? null))
    store.setNotes(t.id, nextNotes)
  close()
}
</script>

<template>
  <dialog class="modal" :open="!!task">
    <div v-if="task" class="modal-box max-w-md">
      <input
        v-model="title"
        class="input input-bordered w-full font-medium"
        aria-label="Title"
        @keydown.enter.prevent="save"
      >
      <textarea
        v-model="notes"
        class="textarea textarea-bordered mt-3 h-40 w-full"
        placeholder="Notes…"
        aria-label="Notes"
      />
      <div class="modal-action">
        <button class="btn btn-ghost btn-sm" @click="store.deleteTask(task.id); close()">
          Delete
        </button>
        <span class="flex-1" />
        <button class="btn btn-ghost btn-sm" @click="close">
          Cancel
        </button>
        <button class="btn btn-primary btn-sm" @click="save">
          Save
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button>close</button>
    </form>
  </dialog>
</template>
