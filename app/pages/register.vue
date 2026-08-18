<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const name = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  errorMsg.value = ''
  const { error } = await authClient.signUp.email({ name: name.value, email: email.value, password: password.value })
  loading.value = false
  if (error) {
    errorMsg.value = error.message ?? 'Sign up failed'
    return
  }
  // See the note in login.vue — the middleware's session lookup is cached per navigation.
  await navigateTo('/', { external: true })
}
</script>

<template>
  <AuthCard v-slot="{ fieldLabel, field }" mode="signup">
    <form class="flex flex-col gap-[13px]" @submit.prevent="submit">
      <div class="flex flex-col gap-1.5">
        <label :class="fieldLabel" for="ow-name">NAME</label>
        <input
          id="ow-name"
          v-model="name"
          :class="field"
          type="text"
          placeholder="Astrid"
          autocomplete="name"
          required
        >
      </div>
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
          autocomplete="new-password"
          minlength="8"
          required
        >
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="mt-[3px] cursor-pointer rounded-[10px] border-none py-3 text-[14.5px] font-semibold disabled:opacity-60"
        style="background: var(--ow-accent); color: var(--ow-accent-content);"
      >
        {{ loading ? '…' : 'Create account' }}
      </button>
      <p v-if="errorMsg" class="text-[13px]" style="color: var(--color-error);">
        {{ errorMsg }}
      </p>
    </form>
  </AuthCard>
</template>
