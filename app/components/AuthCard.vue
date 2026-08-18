<script setup lang="ts">
defineProps<{ mode: 'signin' | 'signup' }>()

const host = ref('')
// Shown on the create-account tab of an instance that has no users yet.
const { data: setup } = await useFetch('/api/setup-state')
const isFresh = computed(() => setup.value && !setup.value.hasUsers)

onMounted(() => {
  host.value = window.location.host
})

const fieldLabel = 'text-xs font-semibold tracking-[0.06em] text-ow-faint'
const field = 'rounded-[10px] border border-ow-border bg-ow-surface px-3 py-2.5 text-[14.5px] outline-none focus:border-ow-mark'
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-ow-bg p-6">
    <!-- the week's column rules, carried onto the sign-in frame -->
    <div
      class="flex w-full max-w-[790px] items-center justify-center rounded-2xl border border-ow-border bg-ow-shell py-14 shadow-ow-4"
      style="background-image: repeating-linear-gradient(90deg, transparent 0px, transparent 111px, var(--ow-hairline) 111px, var(--ow-hairline) 112px);"
    >
      <div class="flex w-[366px] flex-col gap-[18px] rounded-[18px] border border-ow-border bg-ow-surface px-7 pb-[22px] pt-7 shadow-ow-3">
        <div class="flex flex-col items-center gap-[11px] pt-1">
          <BrandMark :show-wordmark="false" class="scale-150" />
          <h1 class="font-brand text-[27px] font-semibold tracking-[-0.025em] text-ow-ink">
            Openweek
          </h1>
        </div>

        <div class="flex rounded-[10px] bg-ow-sunken p-[3px]">
          <NuxtLink
            to="/login"
            class="flex-1 rounded-lg py-2 text-center text-sm no-underline transition-colors"
            :class="mode === 'signin' ? 'bg-ow-surface font-semibold text-ow-ink shadow-ow-1' : 'text-ow-secondary'"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="flex-1 rounded-lg py-2 text-center text-sm no-underline transition-colors"
            :class="mode === 'signup' ? 'bg-ow-surface font-semibold text-ow-ink shadow-ow-1' : 'text-ow-secondary'"
          >
            Create account
          </NuxtLink>
        </div>

        <slot :field-label="fieldLabel" :field="field" />

        <p v-if="mode === 'signup' && isFresh" class="text-center text-[12.5px] leading-relaxed text-ow-muted">
          This is a fresh instance — the first account becomes the admin.
        </p>
      </div>
    </div>

    <p class="fixed bottom-5 left-0 right-0 text-center text-[12px] text-ow-ghost">
      {{ host }} · Openweek · self-hosted
    </p>
  </main>
</template>
