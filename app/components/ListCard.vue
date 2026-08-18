<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'
import type { ListWithTasks } from '~~/shared/schemas/week'
import { HIGHLIGHT_INKS, INK_LABELS, inkColor } from '~~/shared/constants/colors'

const props = defineProps<{ list: ListWithTasks }>()
const emit = defineEmits<{ openTask: [Task, DOMRect] }>()

const week = useWeekStore()
const settings = useSettingsStore()

const card = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const renameInput = ref<HTMLInputElement | null>(null)

const menuOpen = ref(false)
/** True while a dragged task is over the card itself rather than one of its rows. */
const dropAtEnd = ref(false)
const renaming = ref(false)
const draftName = ref('')

const container = computed(() => ({ listId: props.list.id }))

useDismissable(menu, () => (menuOpen.value = false), trigger)

const doneTasks = computed(() => props.list.tasks.filter(t => t.completedAt))
const hasFold = computed(() => (settings.settings?.collapseDone ?? true) && doneTasks.value.length > 0)
const foldOpen = computed(() => week.isFoldOpen(container.value))
const visibleTasks = computed(() =>
  hasFold.value && !foldOpen.value ? props.list.tasks.filter(t => !t.completedAt) : props.list.tasks,
)
const foldLabel = computed(() =>
  foldOpen.value ? `Hide ${doneTasks.value.length} done` : `${doneTasks.value.length} done`,
)

async function startRename() {
  draftName.value = props.list.name
  renaming.value = true
  menuOpen.value = false
  await nextTick()
  renameInput.value?.select()
}
function commitRename() {
  const name = draftName.value.trim()
  renaming.value = false
  if (name && name !== props.list.name) week.updateList(props.list.id, { name })
}

function remove() {
  menuOpen.value = false
  week.deleteList(props.list.id)
}

onMounted(() => {
  if (card.value) {
    const stop = containerDropTarget(card.value, container.value, a => (dropAtEnd.value = a))
    onUnmounted(stop)
  }
})
</script>

<template>
  <div
    ref="card"
    class="flex min-h-[176px] flex-col rounded-xl border border-ow-border bg-ow-surface px-2.5 pb-[9px] pt-[11px]"
  >
    <div class="flex items-center gap-2 px-[3px] pb-[9px]">
      <span
        class="h-[9px] w-[9px] flex-none rounded-[3px]"
        :style="{ background: inkColor(list.color) }"
        aria-hidden="true"
      />
      <input
        v-if="renaming"
        ref="renameInput"
        v-model="draftName"
        type="text"
        class="min-w-0 flex-1 rounded-md border bg-ow-surface px-1.5 py-0.5 text-[14.5px] font-semibold outline-none"
        style="border-color: var(--ow-accent-edge);"
        @keydown.enter.prevent="commitRename"
        @keydown.esc.prevent="renaming = false"
        @blur="commitRename"
      >
      <span v-else class="truncate text-[14.5px] font-semibold text-ow-ink">{{ list.name }}</span>
      <div class="flex-1" />
      <span class="text-[12.5px] text-ow-muted">{{ list.tasks.length }}</span>

      <div class="relative">
        <button
          ref="trigger"
          type="button"
          title="Rename, recolour, delete"
          :aria-label="`Options for ${list.name}`"
          :aria-expanded="menuOpen"
          class="cursor-pointer border-none bg-transparent px-[3px] py-0.5 text-sm leading-none text-ow-faint transition-colors hover:text-ow-ink"
          @click="menuOpen = !menuOpen"
        >
          ⋯
        </button>
        <div
          v-if="menuOpen"
          ref="menu"
          class="absolute right-0 top-6 z-[60] w-[188px] rounded-[11px] border border-ow-border bg-ow-surface p-[6px] shadow-ow-2"
        >
          <button
            type="button"
            class="w-full cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-[7px] text-left text-[13.5px] text-ow-strong transition-colors hover:bg-ow-inset hover:text-ow-ink"
            @click="startRename"
          >
            Rename
          </button>
          <div class="px-2.5 pb-1 pt-2 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
            COLOUR
          </div>
          <div class="flex gap-1.5 px-2.5 pb-1.5">
            <button
              v-for="ink in HIGHLIGHT_INKS"
              :key="ink"
              type="button"
              :title="INK_LABELS[ink]"
              :aria-label="INK_LABELS[ink]"
              :aria-pressed="list.color === ink"
              class="h-[18px] w-[18px] cursor-pointer rounded-md border-none"
              :style="{
                background: `var(--ow-hl-${ink})`,
                boxShadow: list.color === ink ? '0 0 0 2px var(--ow-surface), 0 0 0 3.5px var(--ow-ink)' : 'none',
              }"
              @click="week.updateList(list.id, { color: ink }); menuOpen = false"
            />
          </div>
          <div class="mx-1.5 my-1 h-px bg-ow-hairline" />
          <button
            type="button"
            class="w-full cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-[7px] text-left text-[13.5px] transition-colors hover:bg-ow-inset"
            style="color: var(--color-error);"
            @click="remove"
          >
            Delete list…
          </button>
        </div>
      </div>
    </div>

    <div class="mx-0.5 mb-[9px] h-px bg-ow-hairline" />

    <TaskItem
      v-for="t in visibleTasks"
      :key="t.id"
      :task="t"
      :container="container"
      @open="(t, r) => emit('openTask', t, r)"
    />

    <DropLine v-if="dropAtEnd" />

    <p v-if="!list.tasks.length && !dropAtEnd" class="px-1 pb-1 text-[13px] text-ow-muted">
      Nothing here yet.
    </p>

    <button
      v-if="hasFold"
      type="button"
      class="mb-2 cursor-pointer self-start rounded-[7px] border-none bg-transparent px-2 py-1 text-[12.5px] text-ow-muted transition-colors hover:bg-ow-inset hover:text-ow-title"
      :aria-expanded="foldOpen"
      @click="week.toggleFold(container)"
    >
      {{ foldLabel }}
    </button>

    <TaskComposer :container="container" />
  </div>
</template>
