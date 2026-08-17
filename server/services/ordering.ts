import { generateJitteredKeyBetween } from 'fractional-indexing-jittered'

/**
 * A fractional index key strictly between `a` and `b` (either may be null for the
 * ends). Jitter avoids identical colliding keys under concurrent same-slot inserts;
 * always sort rows by `(position, id)`.
 */
export function keyBetween(a: string | null, b: string | null): string {
  return generateJitteredKeyBetween(a, b)
}
