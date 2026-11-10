export type ReadabilityLocale = "pt-BR" | "en";

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

/**
 * Deterministic Portuguese / English syllable estimator using vowel-group rules.
 */
export function estimateWordSyllables(word: string, locale: ReadabilityLocale = "pt-BR"): number {
  const cleaned = word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  let normalized = cleaned;
  if (locale === "en") {
    normalized = normalized.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    normalized = normalized.replace(/^y/, "");
  }

  const vowelGroups = normalized.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

/**
 * Calculates Flesch Reading Ease adapted for PT-BR (248.835 constant) and EN (206.835).
 */
export function calculateFleschReadability(
  text: string,
  locale: ReadabilityLocale = "pt-BR"
): number {
  const words = text.trim().match(/[\p{L}\p{N}'-]+/gu) ?? [];
  if (words.length < 10) return 72;

  const sentences = Math.max(
    1,
    text
      .split(/[.!?]+/)
      .filter((segment) => segment.trim().length > 0).length
  );

  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += estimateWordSyllables(word, locale);
  }

  const asl = words.length / sentences;
  const asw = totalSyllables / words.length;
  const baseConstant = locale === "pt-BR" ? 248.835 : 206.835;
  const rawScore = baseConstant - 1.015 * asl - 84.6 * asw;

  return Math.max(5, Math.min(98, Math.round(rawScore)));
}

export function interpretFleschBand(
  score: number,
  locale: ReadabilityLocale = "pt-BR"
): string {
  if (locale === "en") {
    if (score >= 75) return "Very fluid and accessible prose";
    if (score >= 55) return "Balanced literary pace";
    return "Dense prose with long sentences";
  }
  if (score >= 75) return "Prosa fluida e acessível";
  if (score >= 55) return "Ritmo literário equilibrado";
  return "Prosa densa — sentenças longas";
}
