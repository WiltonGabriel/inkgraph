const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length;
const MID_INDEX = Math.floor(BASE / 2);

function charToIndex(char: string | undefined, fallback: number): number {
  if (!char) return fallback;
  const idx = ALPHABET.indexOf(char);
  return idx === -1 ? fallback : idx;
}

/**
 * Computes a lexicographically ordered key strictly between `before` and `after`
 * so chapters, scenes, and board cards can be reordered without renumbering siblings.
 */
export function generateFractionalKeyBetween(
  before?: string | null,
  after?: string | null
): string {
  const left = before ?? "";
  const right = after ?? "";

  if (left && right && left >= right) {
    throw new Error(`Invalid fractional key bounds: '${left}' must be < '${right}'`);
  }

  let prefix = "";
  const maxLen = Math.max(left.length, right.length) + 1;

  for (let i = 0; i < maxLen; i += 1) {
    const leftIdx = charToIndex(left[i], 0);
    const rightIdx = i < right.length ? charToIndex(right[i], BASE - 1) : BASE;

    if (leftIdx + 1 < rightIdx) {
      const midIdx = Math.floor((leftIdx + rightIdx) / 2);
      return prefix + ALPHABET[midIdx]!;
    }

    prefix += ALPHABET[leftIdx] ?? ALPHABET[0]!;
  }

  return prefix + ALPHABET[MID_INDEX]!;
}

/**
 * Generates evenly spaced fractional keys for initial collections or rebalancing.
 */
export function generateInitialFractionalKeys(count: number): string[] {
  const keys: string[] = [];
  let prev: string | null = null;
  for (let i = 0; i < count; i += 1) {
    const next = generateFractionalKeyBetween(prev, null);
    keys.push(next);
    prev = next;
  }
  return keys;
}
