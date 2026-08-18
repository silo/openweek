<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const route = useRoute()

async function submit() {
  loading.value = true
  errorMsg.value = ''
  const { error } = await authClient.signIn.email({ email: email.value, password: password.value })
  loading.value = false
  if (error) {
    errorMsg.value = error.message ?? 'Sign in failed'
    return
  }
  // Full reload rather than a client navigation: the route middleware reads the session
  // through useFetch, which would otherwise serve its cached pre-sign-in result.
  await navigateTo((route.query.redirect as string) || '/', { external: true })
}
</script>

<template>
  <AuthCard v-slot="{ fieldLabel, field }" mode="signin">
    <form class="flex flex-col gap-[13px]" @submit.prevent="submit">
      <div class="flex flex-col gap-1.5">
        <label :class="fieldLabel" for="ow-email">EMAIL</label>
        <input
          id="ow-email"
          v-model="email"
          :class="field"
          type="email"
          placeholder="astrid@example.org"
          autocomplete="email"
          required
        >
      </div>
      <div class="flex flex-col gap-1.5">
        <label :class="fieldLabel" for="ow-password">PASSWORD</label>
        <input
          id="ow-password"
          v-model="password"
          :class="field"
          type="password"
          placeholder="••••••••••"
          autocomplete="current-password"
          required
        >
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="mt-[3px] cursor-pointer rounded-[10px] border-none py-3 text-[14.5px] font-semibold disabled:opacity-60"
        style="background: var(--ow-accent); color: var(--ow-accent-content);"
      >
        {{ loading ? '…' : 'Sign in' }}
      </button>
      <p v-if="errorMsg" class="text-[13px]" style="color: var(--color-error);">
        {{ errorMsg }}
      </p>
    </form>
  </AuthCard>
</template>
