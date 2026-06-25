<script setup lang="ts">
import { authClient, signOut } from '~/utils/auth-client'

const user = useAuthUser()

// Local editable copies of the planner settings.
const weekStartsOn = ref<number>(user.value?.weekStartsOn ?? 1)
const rolloverEnabled = ref<boolean>(user.value?.rolloverEnabled ?? false)
const timezone = ref<string>(user.value?.timezone ?? 'UTC')

const saving = ref(false)
const saved = ref(false)
const error = ref('')

async function save() {
  error.value = ''
  saved.value = false
  saving.value = true
  const { error: err } = await authClient.updateUser({
    weekStartsOn: weekStartsOn.value,
    rolloverEnabled: rolloverEnabled.value,
    timezone: timezone.value,
  })
  saving.value = false
  if (err) {
    error.value = err.message ?? 'Could not save.'
    return
  }
  if (user.value) {
    user.value.weekStartsOn = weekStartsOn.value
    user.value.rolloverEnabled = rolloverEnabled.value
    user.value.timezone = timezone.value
  }
  saved.value = true
}

async function logout() {
  await signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="mx-auto w-full max-w-lg p-6">
    <header class="mb-6 flex items-center justify-between">
      <h1 class="font-accent text-3xl">
        Settings
      </h1>
      <NuxtLink to="/" class="link link-hover text-sm">
        ← Back to week
      </NuxtLink>
    </header>

    <section class="mb-8">
      <h2 class="mb-2 text-sm font-medium uppercase tracking-wide opacity-60">
        Account
      </h2>
      <div class="flex items-center justify-between border-b border-hairline py-2">
        <div>
          <p class="font-medium">
            {{ user?.name }}
          </p>
          <p class="text-sm opacity-70">
            {{ user?.email }}
          </p>
        </div>
        <span v-if="user?.role === 'admin'" class="badge badge-outline">admin</span>
      </div>
    </section>

    <section class="mb-8 flex flex-col gap-4">
      <h2 class="text-sm font-medium uppercase tracking-wide opacity-60">
        Planner
      </h2>

      <label class="flex items-center justify-between">
        <span>Week starts on</span>
        <select v-model.number="weekStartsOn" class="select select-bordered select-sm w-40">
          <option :value="1">Monday</option>
          <option :value="0">Sunday</option>
          <option :value="6">Saturday</option>
        </select>
      </label>

      <label class="flex items-center justify-between">
        <span>Time zone</span>
        <input v-model="timezone" type="text" class="input input-bordered input-sm w-56" placeholder="e.g. Europe/Berlin">
      </label>

      <label class="flex items-center justify-between">
        <span>
          Auto-rollover unfinished tasks
          <span class="block text-sm opacity-60">Move past unfinished tasks to today on open.</span>
        </span>
        <input v-model="rolloverEnabled" type="checkbox" class="toggle">
      </label>

      <div class="flex items-center gap-3">
        <button class="btn btn-primary btn-sm" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
        <span v-if="saved" class="text-sm text-success">Saved.</span>
        <span v-if="error" class="text-sm text-error">{{ error }}</span>
      </div>
    </section>

    <section class="flex items-center justify-between border-t border-hairline pt-4">
      <NuxtLink v-if="user?.role === 'admin'" to="/admin/users" class="link link-hover text-sm">
        Admin · Users
      </NuxtLink>
      <span v-else />
      <button class="btn btn-ghost btn-sm" @click="logout">
        Sign out
      </button>
    </section>
  </div>
</template>
