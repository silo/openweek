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
    getIsSticky: () => true,
    onDrag: ({ self }) => onEdge(extractClosestEdge(self.data)),
    onDragLeave: () => onEdge(null),
    onDrop: () => onEdge(null),
  })
}

export function containerDropTarget(el: HTMLElement, container: Container) {
  const key = containerKey(container)
  const stopDrop = dropTargetForElements({
    element: el,
    canDrop: ({ source }) => source.data.type === 'task',
    getData: () => ({ kind: 'container', container: key }),
  })
  const stopScroll = autoScrollForElements({ element: el, canScroll: ({ source }) => source.data.type === 'task' })
  return () => { stopDrop(); stopScroll() }
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
