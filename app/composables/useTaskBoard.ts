// The single file wrapping the drag-and-drop engine (Pragmatic DnD). Swap the engine here.
import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, type Edge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'

export type { Edge }

/**
 * Where a task can live: a day column or a list card. Encoded as a string so it can ride
 * along in drop-target data, mirroring the design's own `d:`/`l:` container keys.
 */
export type Container = { date: string } | { listId: string }

export function containerKey(c: Container): string {
  return 'date' in c ? `d:${c.date}` : `l:${c.listId}`
}

export function parseContainer(key: string): Container {
  const id = key.slice(2)
  return key.startsWith('d:') ? { date: id } : { listId: id }
}

/** The closest-edge reporting shared by both drop targets. */
function edgeCallbacks(onEdge: (edge: Edge | null) => void) {
  return {
    getIsSticky: () => true,
    onDrag: ({ self }: { self: { data: Record<string, unknown> } }) => onEdge(extractClosestEdge(self.data)),
    onDragLeave: () => onEdge(null),
    onDrop: () => onEdge(null),
  }
}

export function taskDraggable(el: HTMLElement, taskId: string, cb: { onStart: () => void, onEnd: () => void }) {
  return draggable({
    element: el,
    getInitialData: () => ({ type: 'task', taskId }),
    onDragStart: cb.onStart,
    onDrop: cb.onEnd,
  })
}

export function taskDropTarget(el: HTMLElement, taskId: string, container: Container, onEdge: (edge: Edge | null) => void) {
  const key = containerKey(container)
  return dropTargetForElements({
    element: el,
    canDrop: ({ source }) => source.data.type === 'task' && source.data.taskId !== taskId,
    getData: ({ input, element }) => attachClosestEdge({ kind: 'task', taskId, container: key }, { input, element, allowedEdges: ['top', 'bottom'] }),
    ...edgeCallbacks(onEdge),
  })
}

/**
 * `onActive` fires only while this container is the *innermost* target — hovering one of
 * its task rows hands the highlight to that row instead. It is what lets an empty column
 * show a drop line, which rows alone cannot do.
 */
export function containerDropTarget(
  el: HTMLElement,
  container: Container,
  onActive?: (active: boolean) => void,
) {
  const key = containerKey(container)
  const innermost = (targets: { element: Element }[]) => targets[0]?.element === el

  const stopDrop = dropTargetForElements({
    element: el,
    canDrop: ({ source }) => source.data.type === 'task',
    getData: () => ({ kind: 'container', container: key }),
    onDragEnter: ({ location }) => onActive?.(innermost(location.current.dropTargets)),
    onDrag: ({ location }) => onActive?.(innermost(location.current.dropTargets)),
    onDragLeave: () => onActive?.(false),
    onDrop: () => onActive?.(false),
  })
  const stopScroll = autoScrollForElements({ element: el, canScroll: ({ source }) => source.data.type === 'task' })
  return () => { stopDrop(); stopScroll() }
}

/* --- reordering the lists themselves ---------------------------------------
   A separate `list` drag type. Tasks live inside list cards, so sharing a type would make
   every card a drop target for its own rows; keeping them distinct means each `canDrop`
   ignores the other. The card is the draggable but only its header is the handle,
   otherwise picking up a task would pick up the card too. */

export function listDraggable(
  el: HTMLElement,
  handle: HTMLElement,
  listId: string,
  cb: { onStart: () => void, onEnd: () => void },
) {
  return draggable({
    element: el,
    dragHandle: handle,
    getInitialData: () => ({ type: 'list', listId }),
    onDragStart: cb.onStart,
    onDrop: cb.onEnd,
  })
}

export function listDropTarget(el: HTMLElement, listId: string, onEdge: (edge: Edge | null) => void) {
  return dropTargetForElements({
    element: el,
    canDrop: ({ source }) => source.data.type === 'list' && source.data.listId !== listId,
    getData: ({ input, element }) => attachClosestEdge({ listId }, { input, element, allowedEdges: ['left', 'right'] }),
    ...edgeCallbacks(onEdge),
  })
}

export function listBoardMonitor(onDrop: (info: { listId: string, overListId: string, after: boolean }) => void) {
  return monitorForElements({
    canMonitor: ({ source }) => source.data.type === 'list',
    onDrop({ source, location }) {
      const target = location.current.dropTargets[0]
      if (!target) return
      onDrop({
        listId: source.data.listId as string,
        overListId: target.data.listId as string,
        after: extractClosestEdge(target.data) === 'right',
      })
    },
  })
}

export interface DropInfo {
  taskId: string
  over:
    | { kind: 'task', taskId: string, container: Container, after: boolean }
    | { kind: 'container', container: Container }
}

export function taskBoardMonitor(onDrop: (info: DropInfo) => void) {
  return monitorForElements({
    canMonitor: ({ source }) => source.data.type === 'task',
    onDrop({ source, location }) {
      const taskId = source.data.taskId as string
      const target = location.current.dropTargets[0]
      if (!target) return
      const data = target.data
      const container = parseContainer(data.container as string)
      if (data.kind === 'task') {
        onDrop({ taskId, over: { kind: 'task', taskId: data.taskId as string, container, after: extractClosestEdge(data) === 'bottom' } })
      }
      else if (data.kind === 'container') {
        onDrop({ taskId, over: { kind: 'container', container } })
      }
    },
  })
}
