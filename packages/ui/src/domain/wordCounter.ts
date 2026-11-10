export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function calculateFleschReadability(text: string): number {
  const words = countWords(text);
  if (words < 10) return 72;
  const sentences = Math.max(1, text.split(/[.!?]+/).filter((s) => s.trim()).length);
  const avgSentenceLen = words / sentences;
  const score = Math.round(100 - avgSentenceLen * 1.45);
  return Math.max(20, Math.min(95, score));
}
