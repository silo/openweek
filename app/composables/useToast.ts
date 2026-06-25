export type ToastType = 'error' | 'info' | 'success'

export interface Toast {
  id: string
  message: string
  type: ToastType
  action?: { label: string, run: () => void }
}

let seq = 0

/** Tiny transient-notification store. Used for optimistic-rollback errors and undo. */
export function useToasts() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function remove(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function push(message: string, type: ToastType = 'info', action?: Toast['action'], ttl = 5000) {
    const id = `t${seq++}`
    toasts.value = [...toasts.value, { id, message, type, action }]
    if (import.meta.client && ttl > 0)
      setTimeout(() => remove(id), ttl)
    return id
  }

  return { toasts, push, remove }
}
