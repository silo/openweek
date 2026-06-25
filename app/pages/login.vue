<script setup lang="ts">
import { signIn } from '~/utils/auth-client'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { data: config } = await useFetch('/api/auth-config')

async function onSubmit() {
  error.value = ''
  loading.value = true
  const { error: err } = await signIn.email({ email: email.value, password: password.value })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Could not sign in.'
    return
  }
  await navigateTo('/')
}

function onGoogle() {
  signIn.social({ provider: 'google', callbackURL: '/' })
}
</script>

<template>
  <div class="grid min-h-full place-items-center p-6">
    <div class="w-full max-w-sm">
      <h1 class="mb-6 text-center font-accent text-4xl">
        Openweek
      </h1>

      <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
        <h2 class="text-lg font-medium">
          Sign in
        </h2>

        <label class="floating-label">
          <span>Email</span>
          <input v-model="email" type="email" placeholder="Email" autocomplete="email" required class="input input-bordered w-full">
        </label>

        <label class="floating-label">
          <span>Password</span>
          <input v-model="password" type="password" placeholder="Password" autocomplete="current-password" required class="input input-bordered w-full">
        </label>

        <p v-if="error" class="text-sm text-error">
          {{ error }}
        </p>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>

        <button v-if="config?.googleEnabled" type="button" class="btn btn-outline" @click="onGoogle">
          Continue with Google
        </button>

        <p class="mt-2 text-center text-sm opacity-70">
          No account?
          <NuxtLink to="/register" class="link">
            Create one
          </NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
