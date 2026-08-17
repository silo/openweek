<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)

async function handleSignOut() {
  await authClient.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-6 py-12">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="font-display text-xl font-semibold tracking-tight">Settings</h1>
      <NuxtLink to="/" class="font-display text-sm text-ow-muted hover:text-ow-ink">← Back to week</NuxtLink>
    </div>

    <section class="rounded-xl border border-ow-border bg-ow-surface p-6">
      <h2 class="mb-5 font-display text-xs uppercase tracking-widest text-ow-faint">Appearance</h2>
      <ThemeControls />
    </section>

    <section class="mt-6 rounded-xl border border-ow-border bg-ow-surface p-6">
      <h2 class="mb-5 font-display text-xs uppercase tracking-widest text-ow-faint">Calendars</h2>
      <CalendarSettings />
    </section>

    <section class="mt-6 rounded-xl border border-ow-border bg-ow-surface p-6">
      <h2 class="mb-4 font-display text-xs uppercase tracking-widest text-ow-faint">Account</h2>
      <p class="font-display text-sm">
        {{ session?.user?.email }}<span v-if="session?.user?.role" class="text-ow-muted"> · {{ session.user.role }}</span>
      </p>
      <button
        class="mt-4 rounded-lg border border-ow-border px-3 py-1.5 font-display text-sm text-ow-muted transition-colors hover:text-ow-ink"
        @click="handleSignOut"
      >
        Sign out
      </button>
    </section>
  </main>
</template>
