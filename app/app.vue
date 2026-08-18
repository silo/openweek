<script setup lang="ts">
import { FONT_STACKS, TEXT_SCALES } from '~/composables/useTheme'
import { DEFAULT_ACCENT } from '~~/shared/constants/colors'

const settings = useSettingsStore()

/**
 * Render the appearance into the initial HTML.
 *
 * `system` cannot be resolved on the server, so it ships as Paper plus the inline script
 * below, which flips to Ink before first paint when the OS asks for it. Without this the
 * page paints Paper and corrects itself after hydration — a visible flash on every load.
 */
const themeAttr = computed(() =>
  settings.settings?.theme === 'ink' ? 'openweek-dark' : 'openweek',
)
const isSystem = computed(() => (settings.settings?.theme ?? 'system') === 'system')

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
