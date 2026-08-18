<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)

const TABS = ['Appearance', 'Calendars', 'Account'] as const
const tab = ref<(typeof TABS)[number]>('Appearance')

async function handleSignOut() {
  await authClient.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-ow-bg p-6">
    <main class="mx-auto max-w-[980px] overflow-hidden rounded-2xl border border-ow-border bg-ow-surface shadow-ow-4">
      <header class="flex items-center gap-4 border-b border-ow-line px-5 py-3.5">
        <NuxtLink
          to="/"
          class="rounded-[9px] border border-ow-border px-3 py-1.5 text-[13.5px] text-ow-text no-underline transition-colors hover:bg-ow-sunken hover:text-ow-ink"
        >
          ‹ Week
        </NuxtLink>
        <h1 class="font-display text-lg font-semibold tracking-[-0.02em] text-ow-ink">
          Settings
        </h1>
        <div class="flex-1" />
        <nav class="flex gap-1">
          <button
            v-for="t in TABS"
            :key="t"
            type="button"
            :aria-current="tab === t ? 'page' : undefined"
            class="cursor-pointer rounded-[9px] border-none px-3 py-1.5 text-[13.5px] transition-colors"
            :class="tab === t ? 'bg-ow-sunken font-semibold text-ow-ink' : 'bg-transparent text-ow-muted hover:text-ow-ink'"
            @click="tab = t"
          >
            {{ t }}
          </button>
        </nav>
      </header>

      <div class="px-6 py-7">
        <AppearanceSettings v-if="tab === 'Appearance'" />
        <CalendarSettings v-else-if="tab === 'Calendars'" />
        <section v-else class="flex flex-col gap-4">
          <div>
            <h3 class="mb-2 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
              SIGNED IN AS
            </h3>
            <p class="text-sm text-ow-ink">
              {{ session?.user?.name }}
            </p>
            <p class="text-[13px] text-ow-muted">
              {{ session?.user?.email }}
            </p>
          </div>
          <OwButton class="self-start" @click="handleSignOut">
            Sign out
          </OwButton>
        </section>
      </div>
    </main>
  </div>
</template>
