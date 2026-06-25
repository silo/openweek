import { generateKeyBetween } from 'fractional-indexing-jittered'

// Pure fractional-index ordering helpers, shared by the store, the DnD monitor,
// and the move-menu. Kept dependency-light (only the index lib) so they're unit
// testable. Always sort by (position, id) — never position alone (see docs).

export interface Positioned { id: string, position: string }

export type Edge = 'top' | 'bottom' | null

/** Stable (position, id) comparator. */
export function byPosition(a: Positioned, b: Positioned): number {
  if (a.position !== b.position)
    return a.position < b.position ? -1 : 1
  return a.id < b.id ? -1 : 1
}

/** Position appended after the last item in an ordered scope (empty ⇒ first key). */
export function appendPosition(ordered: Positioned[]): string {
  return generateKeyBetween(ordered.at(-1)?.position ?? null, null)
}

/**
 * Position to insert at, relative to an `over` item's closest edge — excluding
 * the moving item from the neighbor calculation. `overId === null` (or not
 * found, e.g. an empty column) appends to the end.
 */
export function positionForEdge(
  ordered: Positioned[],
  overId: string | null,
  edge: Edge,
  sourceId: string,
): string {
  const list = ordered.filter(t => t.id !== sourceId)
  if (!overId)
    return generateKeyBetween(list.at(-1)?.position ?? null, null)
  const idx = list.findIndex(t => t.id === overId)
  if (idx === -1)
    return generateKeyBetween(list.at(-1)?.position ?? null, null)
  if (edge === 'top')
    return generateKeyBetween(list[idx - 1]?.position ?? null, list[idx]!.position)
  return generateKeyBetween(list[idx]!.position, list[idx + 1]?.position ?? null)
}

/** Position to move an item up/down one slot within its ordered scope, or null at the edge. */
export function positionForReorder(
  ordered: Positioned[],
  id: string,
  dir: 'up' | 'down',
): string | null {
  const i = ordered.findIndex(t => t.id === id)
  if (i === -1)
    return null
  if (dir === 'up') {
    if (i <= 0)
      return null
    return generateKeyBetween(ordered[i - 2]?.position ?? null, ordered[i - 1]!.position)
  }
  if (i >= ordered.length - 1)
    return null
  return generateKeyBetween(ordered[i + 1]!.position, ordered[i + 2]?.position ?? null)
}
