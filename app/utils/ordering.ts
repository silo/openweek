import { generateKeyBetween } from 'fractional-indexing-jittered'

/** Client-side fractional index key strictly between `a` and `b` (for drag-drop reordering). */
export function keyBetween(a: string | null, b: string | null): string {
  return generateKeyBetween(a, b)
}
