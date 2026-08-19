<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'
import type { ListWithTasks } from '~~/shared/schemas/week'
import { HIGHLIGHT_INKS, INK_LABELS, inkColor } from '~~/shared/constants/colors'
import type { Edge } from '~/composables/useTaskBoard'

const props = defineProps<{ list: ListWithTasks }>()
const emit = defineEmits<{ openTask: [Task, DOMRect] }>()

const week = useWeekStore()

/** The outer wrapper takes the *list* drop target; the card itself takes the task one. */
const root = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const header = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const renameInput = ref<HTMLInputElement | null>(null)

const menuOpen = ref(false)
// "Delete list…" promises a confirmation step; deleting takes its tasks with it.
const confirmingDelete = ref(false)
/** True while a dragged task is over the card itself rather than one of its rows. */
const dropAtEnd = ref(false)
/** Which side of this card a dragged *list* would land on. */
const listEdge = ref<Edge | null>(null)
const draggingCard = ref(false)
const renaming = ref(false)
const draftName = ref('')

const container = computed(() => ({ listId: props.list.id }))

// Closing the menu also disarms the delete — otherwise reopening it lands you on an
// armed destructive button.
useDismissable(menu, () => {
  menuOpen.value = false
  confirmingDelete.value = false
}, trigger)

// Destructured so the refs unwrap in the template.
const { visibleTasks, hasFold, isOpen: foldOpen, label: foldLabel, toggle: toggleFold }
  = useDoneFold(container, () => props.list.tasks)

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
  confirmingDelete.value = false
  menuOpen.value = false
  week.deleteList(props.list.id)
}

onMounted(() => {
  if (!card.value || !root.value) return
  // Pragmatic DnD keys its drop-target registry by element, so the two targets have to sit
  // on different nodes: registering both on the card silently dropped whichever was added
  // first, leaving tasks with nowhere to land on a list.
  const stops = [
    containerDropTarget(card.value, container.value, a => (dropAtEnd.value = a)),
    listDropTarget(root.value, props.list.id, e => (listEdge.value = e)),
  ]
  // The header is the handle so grabbing a task row does not pick the whole card up.
  if (header.value) {
    stops.push(listDraggable(card.value, header.value, props.list.id, {
      onStart: () => (draggingCard.value = true),
      onEnd: () => (draggingCard.value = false),
    }))
  }
  onUnmounted(() => stops.forEach(stop => stop()))
})
</script>

<template>
  <div ref="root" class="flex items-stretch gap-1.5">
    <div v-if="listEdge === 'left'" class="w-[3px] flex-none rounded-sm bg-ow-accent" aria-hidden="true" />

    <div
      ref="card"
      class="flex min-h-[176px] flex-1 flex-col rounded-xl border border-ow-border bg-ow-surface px-2.5 pb-[9px] pt-[11px] transition-opacity"
      :class="draggingCard && 'opacity-45'"
    >
      <!-- the header doubles as the drag handle for reordering the rail -->
      <div ref="header" class="flex cursor-grab items-center gap-2 px-[3px] pb-[9px]">
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
            <template v-if="confirmingDelete">
              <p class="px-2.5 pb-1.5 pt-1 text-[12.5px] leading-relaxed text-ow-muted">
                Delete “{{ list.name }}” and its {{ list.tasks.length }}
                {{ list.tasks.length === 1 ? 'task' : 'tasks' }}?
              </p>
              <div class="flex gap-1.5 px-2.5 pb-1">
                <button
                  type="button"
                  class="cursor-pointer rounded-[7px] border-none px-2.5 py-1 text-[13px] font-semibold text-white"
                  style="background: var(--color-error);"
                  @click="remove"
                >
                  Delete
                </button>
                <button
                  type="button"
                  class="cursor-pointer border-none bg-transparent px-1 text-[13px] text-ow-muted hover:text-ow-ink"
                  @click="confirmingDelete = false"
                >
                  Cancel
                </button>
              </div>
            </template>
            <button
              v-else
              type="button"
              class="w-full cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-[7px] text-left text-[13.5px] transition-colors hover:bg-ow-inset"
              style="color: var(--color-error);"
              @click="confirmingDelete = true"
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
      <DoneFold v-if="hasFold" :label="foldLabel" :expanded="foldOpen" @click="toggleFold" />

      <TaskComposer :container="container" />
    </div>

    <div v-if="listEdge === 'right'" class="w-[3px] flex-none rounded-sm bg-ow-accent" aria-hidden="true" />
  </div>
</template>
