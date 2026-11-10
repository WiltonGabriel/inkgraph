export interface WordDiffSegment {
  readonly type: "equal" | "added" | "removed";
  readonly text: string;
}

export interface WordDiffSummary {
  readonly segments: WordDiffSegment[];
  readonly addedWords: number;
  readonly removedWords: number;
  readonly unchangedWords: number;
}

const MAX_LCS_CELLS = 400_000;

function tokenizePreservingWhitespace(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

function isWordToken(token: string): boolean {
  return /\S/.test(token);
}

function appendSegment(segments: WordDiffSegment[], type: WordDiffSegment["type"], text: string): void {
  const prev = segments[segments.length - 1];
  if (prev && prev.type === type) {
    segments[segments.length - 1] = { type, text: prev.text + text };
    return;
  }
  segments.push({ type, text });
}

/**
 * Computes a sequential token-by-token diff preserving whitespace using LCS,
 * with bounded fallback for very large scenes.
 */
export function computeWordDiff(originalText: string, revisedText: string): WordDiffSummary {
  if (originalText === revisedText) {
    const words = originalText.trim() ? originalText.trim().split(/\s+/).length : 0;
    return {
      segments: originalText ? [{ type: "equal", text: originalText }] : [],
      addedWords: 0,
      removedWords: 0,
      unchangedWords: words,
    };
  }

  const a = tokenizePreservingWhitespace(originalText);
  const b = tokenizePreservingWhitespace(revisedText);

  // Strip common prefix and suffix before DP matrix allocation
  let prefixLen = 0;
  while (prefixLen < a.length && prefixLen < b.length && a[prefixLen] === b[prefixLen]) {
    prefixLen += 1;
  }

  let aEnd = a.length;
  let bEnd = b.length;
  while (aEnd > prefixLen && bEnd > prefixLen && a[aEnd - 1] === b[bEnd - 1]) {
    aEnd -= 1;
    bEnd -= 1;
  }

  const segments: WordDiffSegment[] = [];
  let addedWords = 0;
  let removedWords = 0;
  let unchangedWords = 0;

  for (let i = 0; i < prefixLen; i += 1) {
    const tok = a[i]!;
    appendSegment(segments, "equal", tok);
    if (isWordToken(tok)) unchangedWords += 1;
  }

  const midA = a.slice(prefixLen, aEnd);
  const midB = b.slice(prefixLen, bEnd);
  const m = midA.length;
  const n = midB.length;

  if (m === 0 && n > 0) {
    for (const tok of midB) {
      appendSegment(segments, "added", tok);
      if (isWordToken(tok)) addedWords += 1;
    }
  } else if (n === 0 && m > 0) {
    for (const tok of midA) {
      appendSegment(segments, "removed", tok);
      if (isWordToken(tok)) removedWords += 1;
    }
  } else if (m * n > MAX_LCS_CELLS) {
    for (const tok of midA) {
      appendSegment(segments, "removed", tok);
      if (isWordToken(tok)) removedWords += 1;
    }
    for (const tok of midB) {
      appendSegment(segments, "added", tok);
      if (isWordToken(tok)) addedWords += 1;
    }
  } else if (m > 0 && n > 0) {
    const dp = new Int32Array((m + 1) * (n + 1));
    const stride = n + 1;

    for (let i = m - 1; i >= 0; i -= 1) {
      for (let j = n - 1; j >= 0; j -= 1) {
        if (midA[i] === midB[j]) {
          dp[i * stride + j] = 1 + dp[(i + 1) * stride + (j + 1)]!;
        } else {
          const down = dp[(i + 1) * stride + j]!;
          const right = dp[i * stride + (j + 1)]!;
          dp[i * stride + j] = down >= right ? down : right;
        }
      }
    }

    let i = 0;
    let j = 0;
    while (i < m && j < n) {
      if (midA[i] === midB[j]) {
        const tok = midA[i]!;
        appendSegment(segments, "equal", tok);
        if (isWordToken(tok)) unchangedWords += 1;
        i += 1;
        j += 1;
      } else if (dp[(i + 1) * stride + j]! >= dp[i * stride + (j + 1)]!) {
        const tok = midA[i]!;
        appendSegment(segments, "removed", tok);
        if (isWordToken(tok)) removedWords += 1;
        i += 1;
      } else {
        const tok = midB[j]!;
        appendSegment(segments, "added", tok);
        if (isWordToken(tok)) addedWords += 1;
        j += 1;
      }
    }

    while (i < m) {
      const tok = midA[i]!;
      appendSegment(segments, "removed", tok);
      if (isWordToken(tok)) removedWords += 1;
      i += 1;
    }
    while (j < n) {
      const tok = midB[j]!;
      appendSegment(segments, "added", tok);
      if (isWordToken(tok)) addedWords += 1;
      j += 1;
    }
  }

  for (let i = aEnd; i < a.length; i += 1) {
    const tok = a[i]!;
    appendSegment(segments, "equal", tok);
    if (isWordToken(tok)) unchangedWords += 1;
  }

  return {
    segments,
    addedWords,
    removedWords,
    unchangedWords,
  };
}
