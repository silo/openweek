<script setup lang="ts">
import { FONT_STACKS, TEXT_SCALES, prefersInk } from '~/composables/useTheme'
import { DEFAULT_ACCENT } from '~~/shared/constants/colors'

const settings = useSettingsStore()

/**
 * Render the appearance into the initial HTML.
 *
 * `system` cannot be resolved on the server, so it ships as Paper plus the inline script
 * below, which flips to Ink before first paint when the OS asks for it. Without this the
 * page paints Paper and corrects itself after hydration — a visible flash on every load.
 *
 * On the client the media query *is* readable, and it has to be read here rather than left
 * to the inline script: unhead re-applies `htmlAttrs` against the live DOM on its first
 * client render, so a server-shaped `openweek` would undo the script and strand everyone on
 * `system` + a dark OS in Paper. Resolved during setup so the value is already right by the
 * time that render runs.
 */
const systemDark = ref(import.meta.client ? prefersInk('system') : false)

const themeAttr = computed(() => {
  const theme = settings.settings?.theme ?? 'system'
  if (theme === 'system') return systemDark.value ? 'openweek-dark' : 'openweek'
  return theme === 'ink' ? 'openweek-dark' : 'openweek'
})
const isSystem = computed(() => (settings.settings?.theme ?? 'system') === 'system')

onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const sync = () => (systemDark.value = mq.matches)
  mq.addEventListener('change', sync)
  onUnmounted(() => mq.removeEventListener('change', sync))
})

useHead({
  htmlAttrs: {
    'data-theme': themeAttr,
    'data-accent': computed(() => settings.settings?.accentColor ?? DEFAULT_ACCENT),
    'data-follow-system': computed(() => (isSystem.value ? '1' : undefined)),
  },
  style: [{
    id: 'ow-appearance',
    innerHTML: computed(() => {
      const s = settings.settings
      const face = FONT_STACKS[s?.fontStyle ?? 'open-sans']
      return `:root{--ow-text-scale:${TEXT_SCALES[s?.textSize ?? 'default']};`
        + `--ow-font-display:${face};--ow-font-body:${face}}`
    }),
  }],
  script: [{
    id: 'ow-system-theme',
    innerHTML: 'try{var r=document.documentElement;'
      + 'if(r.dataset.followSystem&&matchMedia("(prefers-color-scheme: dark)").matches)'
      + 'r.dataset.theme="openweek-dark"}catch(e){}',
    tagPosition: 'head',
  }],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
