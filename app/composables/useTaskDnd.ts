import type { Edge } from '#shared/utils/ordering'
import type { Ref } from 'vue'
import { positionForEdge } from '#shared/utils/ordering'
import { useBoardStore } from '~/stores/board'

/**
 * Thin Vue wrapper over @atlaskit/pragmatic-drag-and-drop (the engine is
 * swappable in this one file — see docs/decisions.md D3). Browser-only modules
 * are dynamically imported inside onMounted so SSR never evaluates them.
 *
 * Drag is an enhancement; the non-drag "move to…" menu (TaskMoveMenu) is the
 * keyboard/a11y path and a v1 requirement.
 */

export type Scope = { date: string } | { listId: string }

type Pdnd = typeof import('@atlaskit/pragmatic-drag-and-drop/element/adapter')
  & typeof import('@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge')
  & typeof import('@atlaskit/pragmatic-drag-and-drop-auto-scroll/element')
  & typeof import('@atlaskit/pragmatic-drag-and-drop/combine')

let cached: Promise<Pdnd> | null = null
function loadPdnd(): Promise<Pdnd> {
  cached ??= Promise.all([
    import('@atlaskit/pragmatic-drag-and-drop/element/adapter'),
    import('@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'),
    import('@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'),
    import('@atlaskit/pragmatic-drag-and-drop/combine'),
  ]).then(([a, b, c, d]) => ({ ...a, ...b, ...c, ...d }))
  return cached
}

function scopeOf(t: { date: string | null, listId: string | null }): Scope {
  return t.listId != null ? { listId: t.listId } : { date: t.date! }
}

/** Make a task row draggable (via a handle) and a closest-edge drop target. */
export function useDraggableRow(
  rowEl: Ref<HTMLElement | undefined>,
  handleEl: Ref<HTMLElement | undefined>,
  taskId: Ref<string>,
) {
  const dragging = ref(false)
  const edge = ref<Edge>(null)
  let cleanup = () => {}

  onMounted(async () => {
    const pdnd = await loadPdnd()
    if (!rowEl.value)
      return
    cleanup = pdnd.combine(
      pdnd.draggable({
        element: rowEl.value,
        dragHandle: handleEl.value,
        getInitialData: () => ({ type: 'task', taskId: taskId.value }),
        onDragStart: () => { dragging.value = true },
        onDrop: () => { dragging.value = false },
      }),
      pdnd.dropTargetForElements({
        element: rowEl.value,
        canDrop: ({ source }) => source.data.type === 'task',
        getIsSticky: () => true,
        getData: ({ input, element }) =>
          pdnd.attachClosestEdge({ type: 'task-row', taskId: taskId.value }, {
            input,
            element,
            allowedEdges: ['top', 'bottom'],
          }),
        onDrag: ({ self, source }) => {
          edge.value = source.data.taskId === taskId.value ? null : (pdnd.extractClosestEdge(self.data) as Edge)
        },
        onDragLeave: () => { edge.value = null },
        onDrop: () => { edge.value = null },
      }),
    )
  })

  onBeforeUnmount(() => cleanup())
  return { dragging, edge }
}

/** Make a day/list column a drop target (empty space / append). */
export function useDropColumn(el: Ref<HTMLElement | undefined>, getScope: () => Scope) {
  let cleanup = () => {}
  onMounted(async () => {
    const pdnd = await loadPdnd()
    if (!el.value)
      return
    cleanup = pdnd.dropTargetForElements({
      element: el.value,
      canDrop: ({ source }) => source.data.type === 'task',
      getData: () => ({ type: 'column', scope: getScope() }),
    })
  })
  onBeforeUnmount(() => cleanup())
}

/** The single drop monitor + auto-scroll. Mounted once in WeekGrid. */
export function useTaskDndMonitor(scrollEls: Ref<HTMLElement | undefined>[]) {
  const store = useBoardStore()
  let cleanup = () => {}

  function positionFor(scope: Scope, overId: string | null, edge: Edge, sourceId: string) {
    const ordered = 'listId' in scope ? store.tasksForList(scope.listId) : store.tasksForDate(scope.date)
    return positionForEdge(ordered, overId, edge, sourceId)
  }

  onMounted(async () => {
    const pdnd = await loadPdnd()
    const disposers: Array<() => void> = []

    disposers.push(pdnd.monitorForElements({
      canMonitor: ({ source }) => source.data.type === 'task',
      onDrop: ({ source, location }) => {
        const sourceId = source.data.taskId as string
        const inner = location.current.dropTargets[0]
        if (!inner)
          return

        let scope: Scope
        let overId: string | null = null
        let edge: Edge = null

        if (inner.data.type === 'task-row') {
          overId = inner.data.taskId as string
          if (overId === sourceId)
            return
          const overTask = store.tasksById[overId]
          if (!overTask)
            return
          scope = scopeOf(overTask)
          edge = pdnd.extractClosestEdge(inner.data) as Edge
        }
        else if (inner.data.type === 'column') {
          scope = inner.data.scope as Scope
        }
        else {
          return
        }

        store.moveTask(sourceId, scope, positionFor(scope, overId, edge, sourceId))
      },
    }))

    for (const elRef of scrollEls) {
      if (elRef.value)
        disposers.push(pdnd.autoScrollForElements({ element: elRef.value }))
    }

    cleanup = () => disposers.forEach(d => d())
  })

  onBeforeUnmount(() => cleanup())
}
