import { useBoardStore } from '~/stores/board'

// Which list the bottom drawer is showing. Shared via useState so TopBar/tabs/
// drawer agree. Falls back to the first list until one is explicitly selected.
export function useActiveList() {
  const store = useBoardStore()
  const activeId = useState<string | null>('active-list-id', () => null)
  const active = computed(() => store.sortedLists.find(l => l.id === activeId.value) ?? store.sortedLists[0] ?? null)
  return {
    activeId,
    active,
    select: (id: string) => { activeId.value = id },
  }
}
