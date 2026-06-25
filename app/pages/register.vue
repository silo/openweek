<script setup lang="ts">
import { signIn, signUp } from '~/utils/auth-client'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { data: config } = await useFetch('/api/auth-config')

async function onSubmit() {
  error.value = ''
  loading.value = true
  // Detect the client's timezone so "today"/rollover are correct from day one.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const { error: err } = await signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
    timezone,
  })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Could not create your account.'
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
          Create your account
        </h2>
        <p class="text-sm opacity-70">
          The first account on a fresh instance becomes the admin.
        </p>

        <label class="floating-label">
          <span>Name</span>
          <input v-model="name" type="text" placeholder="Name" autocomplete="name" required class="input input-bordered w-full">
        </label>

        <label class="floating-label">
          <span>Email</span>
          <input v-model="email" type="email" placeholder="Email" autocomplete="email" required class="input input-bordered w-full">
        </label>

        <label class="floating-label">
          <span>Password</span>
          <input v-model="password" type="password" placeholder="Password (min 8 chars)" autocomplete="new-password" minlength="8" required class="input input-bordered w-full">
        </label>

        <p v-if="error" class="text-sm text-error">
          {{ error }}
        </p>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>

        <button v-if="config?.googleEnabled" type="button" class="btn btn-outline" @click="onGoogle">
          Continue with Google
        </button>

        <p class="mt-2 text-center text-sm opacity-70">
          Already have an account?
          <NuxtLink to="/login" class="link">
            Sign in
          </NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
