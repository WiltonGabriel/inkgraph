export interface RetrievableChunk {
  readonly id: string;
  readonly kind: 'character' | 'faction' | 'world' | 'scene' | 'object';
  readonly title: string;
  readonly text: string;
}

export interface RetrievalHit {
  readonly chunk: RetrievableChunk;
  readonly score: number;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'was', 'were',
  'que', 'com', 'para', 'uma', 'uns', 'das', 'dos', 'pelo', 'pela', 'nao', 'não',
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]{2,}/g) ?? [])
    .filter((tok) => !STOP_WORDS.has(tok));
}

/**
 * Pure offline BM25-weighted semantic/lexical retriever requiring zero network or external weights.
 */
export function retrieveRelevantContext(
  query: string,
  chunks: readonly RetrievableChunk[],
  limit = 6
): RetrievalHit[] {
  const qTokens = Array.from(new Set(tokenize(query)));
  if (qTokens.length === 0 || chunks.length === 0) return [];

  const tokenizedDocs = chunks.map((chunk) => ({
    chunk,
    titleTokens: tokenize(chunk.title),
    bodyTokens: tokenize(chunk.text),
  }));

  const avgLen =
    tokenizedDocs.reduce((sum, d) => sum + d.bodyTokens.length + 1, 0) / tokenizedDocs.length;

  const docFreq = new Map<string, number>();
  for (const term of qTokens) {
    let count = 0;
    for (const d of tokenizedDocs) {
      if (d.bodyTokens.includes(term) || d.titleTokens.includes(term)) count += 1;
    }
    docFreq.set(term, count);
  }

  const hits: RetrievalHit[] = [];
  const k1 = 1.4;
  const b = 0.75;

  for (const doc of tokenizedDocs) {
    let score = 0;
    const freqMap = new Map<string, number>();
    for (const tok of doc.bodyTokens) {
      freqMap.set(tok, (freqMap.get(tok) ?? 0) + 1);
    }

    for (const term of qTokens) {
      const df = docFreq.get(term) ?? 0;
      const idf = Math.log(1 + (tokenizedDocs.length - df + 0.5) / (df + 0.5));
      const tf = freqMap.get(term) ?? 0;
      const docLen = Math.max(1, doc.bodyTokens.length);
      if (tf > 0) {
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * docLen) / avgLen)));
      }
      if (doc.titleTokens.includes(term)) {
        score += idf * 1.6;
      }
    }

    if (score > 0) {
      hits.push({ chunk: doc.chunk, score });
    }
  }

  return hits.sort((a, bHit) => bHit.score - a.score).slice(0, limit);
}
