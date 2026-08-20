<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'

const emit = defineEmits<{ openTask: [Task, DOMRect] }>()

const week = useWeekStore()
const settings = useSettingsStore()

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

/* --- resizing ---------------------------------------------------------------
   The rail is dragged from its top edge. Below MIN it stops being a rail worth showing, so
   letting go there switches it off exactly as the toolbar's Lists toggle would — and the
   stored height is left alone, so switching it back on restores the size it had. */
const MIN = 128
const FLOOR = 56
const rail = ref<HTMLElement | null>(null)
/** Live height during a drag; null the rest of the time, when the stored one rules. */
const dragging = ref<number | null>(null)

const stored = computed(() => settings.settings?.listsHeight ?? 0)
const height = computed(() => dragging.value ?? (stored.value || null))
const railStyle = computed(() => ({ '--ow-rail-h': height.value ? `${height.value}px` : 'auto' }))
const willHide = computed(() => dragging.value !== null && dragging.value < MIN)

/** Rounded, not just bounded: the measured start height is fractional and the stored one is
 *  a smallint, so an un-rounded drag is a 500 from the settings schema. */
function clamp(px: number) {
  return Math.round(Math.max(FLOOR, Math.min(px, window.innerHeight * 0.7)))
}

let startY = 0
let startH = 0

function onDown(e: PointerEvent) {
  if (e.button !== 0 || !rail.value) return
  startY = e.clientY
  startH = rail.value.getBoundingClientRect().height
  dragging.value = startH
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onMove(e: PointerEvent) {
  if (dragging.value === null) return
  // Up is taller: the handle sits on the rail's top edge, so it pulls the edge with it.
  dragging.value = clamp(startH + (startY - e.clientY))
}

function onUp() {
  const next = dragging.value
  dragging.value = null
  if (next === null) return
  if (next < MIN) settings.update({ showLists: false })
  else settings.update({ listsHeight: next })
}

/** A gesture the browser took away is abandoned, not committed at whatever size it reached. */
function onCancel() {
  dragging.value = null
}

/** The ARIA window-splitter keyboard path, so the rail is sizeable without a pointer. */
function onKey(e: KeyboardEvent) {
  const step = e.shiftKey ? 64 : 24
  const from = height.value ?? rail.value?.getBoundingClientRect().height ?? MIN
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    settings.update({ listsHeight: clamp(from + step) })
  }
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    const next = clamp(from - step)
    if (next < MIN) settings.update({ showLists: false })
    else settings.update({ listsHeight: next })
  }
}
</script>

<template>
  <section
    ref="rail"
    class="ow-rail flex flex-col rounded-b-2xl border-t border-ow-line bg-ow-shell pb-4 transition-opacity"
    :class="[dragging !== null && 'select-none', willHide && 'opacity-45']"
    :style="railStyle"
  >
    <!-- Pointer capture, so a fast drag that leaves the 10px strip keeps resizing. -->
    <div
      class="ow-grip hidden touch-none cursor-ns-resize items-center justify-center gap-2 py-[5px] lg:flex"
      role="separator"
      tabindex="0"
      aria-orientation="horizontal"
      aria-label="Resize the lists area — drag down past the smallest size to hide it"
      :aria-valuenow="height ?? undefined"
      :aria-valuemin="MIN"
      title="Drag to resize · drag right down to hide"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
      @keydown="onKey"
    >
      <span class="h-[3px] w-11 rounded-full bg-ow-border transition-colors" aria-hidden="true" />
      <span v-if="willHide" class="text-[11.5px] font-semibold tracking-[0.04em] text-ow-muted">
        RELEASE TO HIDE
      </span>
    </div>

    <div class="flex items-center gap-3 px-[18px] pb-[11px] pt-3.5 lg:pt-1">
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
         rail scrolls sideways once they no longer fit, rather than squeezing to nothing —
         and vertically too, once the handle has given it a height of its own. -->
    <div
      class="grid grid-cols-1 items-start gap-2.5 px-4 lg:min-h-0 lg:flex-1 lg:auto-cols-[minmax(var(--ow-list-min),1fr)] lg:grid-flow-col lg:grid-cols-none lg:overflow-auto lg:pb-1"
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

<style scoped>
.ow-grip:hover span:first-child,
.ow-grip:focus-visible span:first-child {
  background: var(--ow-muted);
}
</style>
