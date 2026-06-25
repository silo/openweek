import { describe, expect, it } from 'vitest'
import { appendPosition, byPosition, positionForEdge, positionForReorder } from './ordering'

// Three tasks with deterministic fractional keys (generateKeyBetween is deterministic).
const A = { id: 'A', position: 'a0' }
const B = { id: 'B', position: 'a1' }
const C = { id: 'C', position: 'a2' }
const list = [A, B, C]

describe('byPosition', () => {
  it('sorts by position', () => {
    expect([C, A, B].sort(byPosition)).toEqual([A, B, C])
  })
  it('breaks ties by id', () => {
    const x = { id: 'x', position: 'a0' }
    const y = { id: 'y', position: 'a0' }
    expect([y, x].sort(byPosition)).toEqual([x, y])
  })
})

describe('appendPosition', () => {
  it('returns a first key for an empty scope', () => {
    expect(appendPosition([])).toBe('a0')
  })
  it('returns a key after the last item', () => {
    expect(appendPosition(list) > C.position).toBe(true)
  })
})

describe('positionForEdge', () => {
  it('empty scope → appends', () => {
    expect(appendPosition([])).toBe(positionForEdge([], null, null, 'src'))
  })

  it('single item, drop above → key before it', () => {
    const single = [A]
    const pos = positionForEdge(single, 'A', 'top', 'src')
    expect(pos < A.position).toBe(true)
  })

  it('single item, drop below → key after it', () => {
    const single = [A]
    const pos = positionForEdge(single, 'A', 'bottom', 'src')
    expect(pos > A.position).toBe(true)
  })

  it('start: above the first item', () => {
    const pos = positionForEdge(list, 'A', 'top', 'src')
    expect(pos < A.position).toBe(true)
  })

  it('end: below the last item', () => {
    const pos = positionForEdge(list, 'C', 'bottom', 'src')
    expect(pos > C.position).toBe(true)
  })

  it('middle: between neighbors', () => {
    const pos = positionForEdge(list, 'B', 'top', 'src')
    expect(pos > A.position && pos < B.position).toBe(true)
  })

  it('excludes the moving item from neighbor math', () => {
    // Drop A below A's old neighbor B, with B removed: list becomes [A, C].
    const pos = positionForEdge(list, 'A', 'bottom', 'B')
    expect(pos > A.position && pos < C.position).toBe(true)
  })

  it('unknown over-id → appends to end', () => {
    const pos = positionForEdge(list, 'ghost', 'top', 'src')
    expect(pos > C.position).toBe(true)
  })
})

describe('positionForReorder', () => {
  it('moves an item up before its predecessor', () => {
    const pos = positionForReorder(list, 'B', 'up')!
    expect(pos < A.position).toBe(true)
  })
  it('moves an item down after its successor', () => {
    const pos = positionForReorder(list, 'B', 'down')!
    expect(pos > C.position).toBe(true)
  })
  it('returns null at the top edge', () => {
    expect(positionForReorder(list, 'A', 'up')).toBeNull()
  })
  it('returns null at the bottom edge', () => {
    expect(positionForReorder(list, 'C', 'down')).toBeNull()
  })
  it('returns null for an unknown id', () => {
    expect(positionForReorder(list, 'ghost', 'up')).toBeNull()
  })
})
