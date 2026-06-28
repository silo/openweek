import { ACCENT_HEX } from '~/composables/useTaskColors'

/**
 * Apply the user's accent color to the DOM as the runtime --color-accent var,
 * which the paper-v2 theme's bg-accent/text-accent/border-accent utilities read.
 * Client-only (touches document). Defaults to sky.
 */
export default defineNuxtPlugin(() => {
  const user = useAuthUser()
  watchEffect(() => {
    const accent = user.value?.accentColor ?? 'sky'
    const hex = ACCENT_HEX[accent as keyof typeof ACCENT_HEX] ?? ACCENT_HEX.sky
    document.documentElement.style.setProperty('--color-accent', hex)
  })
})
