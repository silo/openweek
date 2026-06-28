<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

interface AdminUser {
  id: string
  name: string
  email: string
  role?: string | null
  banned?: boolean | null
  createdAt: string | Date
}

const users = ref<AdminUser[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  const { data, error: err } = await authClient.admin.listUsers({ query: { limit: 100 } })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Could not load users.'
    return
  }
  users.value = (data?.users ?? []) as AdminUser[]
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString()
}

await load()
</script>

<template>
  <div class="mx-auto w-full max-w-3xl p-6">
    <header class="mb-6 flex items-center justify-between">
      <h1 class="font-mono text-3xl">
        Users
      </h1>
      <NuxtLink to="/settings" class="link link-hover text-sm">
        ← Settings
      </NuxtLink>
    </header>

    <p v-if="error" class="text-error">
      {{ error }}
    </p>
    <p v-else-if="loading" class="opacity-60">
      Loading…
    </p>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>
            <span class="badge" :class="u.role === 'admin' ? 'badge-primary' : 'badge-ghost'">
              {{ u.role ?? 'user' }}
            </span>
          </td>
          <td>{{ fmt(u.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
