<script setup lang="ts">
import type { Task } from '~~/shared/schemas/task'

const week = useWeekStore()
const emit = defineEmits<{ openTask: [task: Task] }>()

const itemTitle = ref('')
const newListName = ref('')
const adding = ref(false)

async function addItem() {
  const v = itemTitle.value.trim()
  if (!v || !week.activeListId) return
  itemTitle.value = ''
  await week.createTaskInList(week.activeListId, v)
}
async function addList() {
  const v = newListName.value.trim()
  if (!v) return
  newListName.value = ''
  adding.value = false
  await week.createList(v)
}
</script>

<template>
  <div class="border-t border-ow-hairline bg-ow-sunken">
    <div class="min-h-[118px] px-7 pb-2.5 pt-3.5">
      <div class="mb-2.5 flex items-center gap-2">
        <span class="font-display text-[9.5px] uppercase tracking-widest text-ow-faint">{{ week.activeList?.name ?? '—' }}</span>
        <span class="font-display text-[9.5px] text-ow-ghost">{{ week.listTasks.length }} items</span>
      </div>
      <div class="grid grid-flow-col grid-rows-2 gap-x-7 gap-y-2 overflow-x-auto" style="grid-auto-columns: minmax(190px, 1fr);">
        <div v-for="t in week.listTasks" :key="t.id" class="flex items-center gap-2.5">
          <button class="cursor-pointer font-display text-[12px]" :class="t.completedAt ? 'text-ow-faint' : 'text-ow-ghost'" @click="week.toggleComplete(t.id)">{{ t.completedAt ? '✓' : '○' }}</button>
          <span class="cursor-text truncate font-display text-[12.5px]" :class="t.completedAt ? 'text-ow-faint line-through' : 'text-ow-ink'" @click="emit('openTask', t)">{{ t.title }}</span>
        </div>
        <div class="flex items-center gap-2.5 text-ow-ghost">
          <span class="font-display text-[12px]">＋</span>
          <input v-model="itemTitle" class="w-full bg-transparent font-display text-[12px] placeholder:text-ow-ghost focus:outline-none" placeholder="Add" @keydown.enter="addItem">
        </div>
      </div>
    </div>

    <div class="flex items-stretch gap-0.5 border-t border-ow-hairline px-6">
      <button
        v-for="l in week.lists"
        :key="l.id"
        class="flex cursor-pointer items-center gap-2 px-4 py-2.5 font-display text-[12px]"
        :class="week.activeListId === l.id ? 'font-medium text-ow-ink' : 'text-ow-muted'"
        :style="week.activeListId === l.id ? { borderBottom: '2px solid var(--ow-accent)', marginBottom: '-1px' } : undefined"
        @click="week.loadList(l.id)"
      >
        <span class="h-[9px] w-[9px] rounded-[3px]" :style="{ background: l.color }" />
        <span>{{ l.name }}</span>
      </button>
      <div class="flex items-center gap-1.5 px-3 py-2.5 font-display text-[12px] text-ow-ghost">
        <input v-if="adding" v-model="newListName" class="w-24 bg-transparent focus:outline-none" placeholder="List name" @keydown.enter="addList" @blur="adding = false">
        <button v-else class="cursor-pointer" @click="adding = true">＋ New list</button>
      </div>
    </div>
  </div>
</template>
