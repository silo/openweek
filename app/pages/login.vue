<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const route = useRoute()

const inputClass = 'rounded-lg border border-ow-border bg-ow-bg px-3 py-2 font-body text-sm outline-none focus:border-ow-muted'

async function submit() {
  loading.value = true
  errorMsg.value = ''
  const { error } = await authClient.signIn.email({ email: email.value, password: password.value })
  loading.value = false
  if (error) {
    errorMsg.value = error.message ?? 'Sign in failed'
    return
  }
  await navigateTo((route.query.redirect as string) || '/')
}
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
    <div class="mb-6 flex items-center gap-2">
      <div class="h-4 w-4 rounded" style="background: var(--ow-accent);" />
      <span class="font-display text-base font-semibold tracking-tight">openweek</span>
    </div>
    <div class="rounded-xl border border-ow-border bg-ow-surface p-6">
      <h1 class="font-display text-lg font-semibold">Sign in</h1>
      <form class="mt-4 flex flex-col gap-3" @submit.prevent="submit">
        <input v-model="email" :class="inputClass" type="email" placeholder="Email" autocomplete="email" required>
        <input v-model="password" :class="inputClass" type="password" placeholder="Password" autocomplete="current-password" required>
        <button
          type="submit" :disabled="loading"
          class="rounded-lg py-2 font-display text-sm font-medium disabled:opacity-60"
          style="background: var(--ow-accent); color: var(--ow-accent-ink);"
        >
          {{ loading ? '…' : 'Sign in' }}
        </button>
        <p v-if="errorMsg" class="text-sm" style="color: #C49097;">{{ errorMsg }}</p>
      </form>
    </div>
    <p class="mt-4 text-center font-display text-sm text-ow-muted">
      No account? <NuxtLink to="/register" class="text-ow-ink underline">Register</NuxtLink>
    </p>
  </main>
</template>
