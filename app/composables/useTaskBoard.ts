// The single file wrapping the drag-and-drop engine (Pragmatic DnD). Swap the engine here.
import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, type Edge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'

export type { Edge }

export function taskDraggable(el: HTMLElement, taskId: string, cb: { onStart: () => void, onEnd: () => void }) {
  return draggable({
    element: el,
    getInitialData: () => ({ type: 'task', taskId }),
    onDragStart: cb.onStart,
    onDrop: cb.onEnd,
  })
}

export function taskDropTarget(el: HTMLElement, taskId: string, date: string, onEdge: (edge: Edge | null) => void) {
  return dropTargetForElements({
    element: el,
    canDrop: ({ source }) => source.data.type === 'task' && source.data.taskId !== taskId,
    getData: ({ input, element }) => attachClosestEdge({ kind: 'task', taskId, date }, { input, element, allowedEdges: ['top', 'bottom'] }),
    getIsSticky: () => true,
    onDrag: ({ self }) => onEdge(extractClosestEdge(self.data)),
    onDragLeave: () => onEdge(null),
    onDrop: () => onEdge(null),
  })
}

export function columnDropTarget(el: HTMLElement, date: string) {
  const stopDrop = dropTargetForElements({
    element: el,
    canDrop: ({ source }) => source.data.type === 'task',
    getData: () => ({ kind: 'column', date }),
  })
  const stopScroll = autoScrollForElements({ element: el, canScroll: ({ source }) => source.data.type === 'task' })
  return () => { stopDrop(); stopScroll() }
}

export interface DropInfo {
  taskId: string
  over:
    | { kind: 'task', taskId: string, date: string, after: boolean }
    | { kind: 'column', date: string }
}

export function taskBoardMonitor(onDrop: (info: DropInfo) => void) {
  return monitorForElements({
    canMonitor: ({ source }) => source.data.type === 'task',
    onDrop({ source, location }) {
      const taskId = source.data.taskId as string
      const target = location.current.dropTargets[0]
      if (!target) return
      const data = target.data
      if (data.kind === 'task') {
        onDrop({ taskId, over: { kind: 'task', taskId: data.taskId as string, date: data.date as string, after: extractClosestEdge(data) === 'bottom' } })
      }
      else if (data.kind === 'column') {
        onDrop({ taskId, over: { kind: 'column', date: data.date as string } })
      }
    },
  })
}
