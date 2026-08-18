<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)

const open = ref(false)
const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)

useDismissable(panel, () => (open.value = false), trigger)

const name = computed(() => session.value?.user?.name ?? '')
const email = computed(() => session.value?.user?.email ?? '')
const initial = computed(() => (name.value || email.value).charAt(0).toUpperCase() || '?')

async function signOut() {
  await authClient.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="relative">
    <button
      ref="trigger"
      type="button"
      title="Account"
      :aria-expanded="open"
      aria-haspopup="true"
      class="h-[34px] w-[34px] cursor-pointer rounded-[11px] border p-0 font-display text-[15px] font-semibold transition-colors"
      style="border-color: var(--ow-accent-edge); background: var(--ow-accent-tint); color: var(--ow-accent);"
      @click="open = !open"
    >
      {{ initial }}
    </button>

    <div
      v-if="open"
      ref="panel"
      class="absolute right-0 top-[42px] z-[80] w-[244px] rounded-[13px] border border-ow-border bg-ow-surface p-[7px] shadow-ow-2"
    >
      <div class="flex flex-col gap-[3px] px-2.5 pb-2.5 pt-[9px]">
        <span class="text-[15px] font-semibold text-ow-ink">{{ name }}</span>
        <span class="truncate text-[12.5px] text-ow-muted">{{ email }}</span>
      </div>
      <div class="mx-[5px] my-1 h-px bg-ow-hairline" />
      <NuxtLink
        to="/settings"
        class="block rounded-lg px-2.5 py-2 text-sm text-ow-strong transition-colors hover:bg-ow-inset hover:text-ow-ink"
        @click="open = false"
      >
        Settings
      </NuxtLink>
      <button
        type="button"
        class="w-full cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-2 text-left text-sm text-ow-strong transition-colors hover:bg-ow-inset hover:text-ow-ink"
        @click="signOut"
      >
        Sign out
      </button>
    </div>
  </div>
</template>
