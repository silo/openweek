// Which task is open in the notes/detail editor modal (one modal, shared state).
export function useTaskEditor() {
  const openId = useState<string | null>('task-editor-open', () => null)
  return {
    openId,
    open: (id: string) => { openId.value = id },
    close: () => { openId.value = null },
  }
}
