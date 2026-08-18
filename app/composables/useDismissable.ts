/**
 * Close-on-Escape and close-on-outside-click for the menus and popovers.
 *
 * `ignore` holds the trigger element so clicking it toggles rather than closing and
 * immediately reopening.
 */
export function useDismissable(
  panel: Ref<HTMLElement | null>,
  onClose: () => void,
  ignore?: Ref<HTMLElement | null>,
) {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }
  function onPointer(e: MouseEvent) {
    const t = e.target as Node | null
    if (!t) return
    if (panel.value?.contains(t)) return
    if (ignore?.value?.contains(t)) return
    onClose()
  }

  onMounted(() => {
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('mousedown', onPointer)
  })
}

/**
 * Trap Tab inside a panel and restore focus to whatever opened it.
 * Popovers in the design focus-trap and return focus on close.
 */
export function useFocusTrap(panel: Ref<HTMLElement | null>) {
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  let restoreTo: HTMLElement | null = null

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !panel.value) return
    const items = [...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null)
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    }
    else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  onMounted(async () => {
    restoreTo = document.activeElement as HTMLElement | null
    await nextTick()
    panel.value?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    window.addEventListener('keydown', onKey)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKey)
    restoreTo?.focus?.()
  })
}
