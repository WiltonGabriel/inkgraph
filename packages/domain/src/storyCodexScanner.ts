export interface DiscoveredCodexCandidate {
  readonly term: string;
  readonly totalMentions: number;
  readonly sceneIds: string[];
  readonly sampleSnippet: string;
}

const COMMON_CAPITALIZED_STOPWORDS = new Set([
  // Portuguese common non-entity sentence starters
  'O', 'A', 'Os', 'As', 'Um', 'Uma', 'Uns', 'Umas', 'Em', 'Na', 'No', 'Nas', 'Nos',
  'De', 'Da', 'Do', 'Das', 'Dos', 'Para', 'Por', 'Com', 'Sem', 'Sob', 'Sobre',
  'Entre', 'Quando', 'Onde', 'Como', 'Porque', 'Mas', 'Porém', 'Contudo', 'Então',
  'Eles', 'Elas', 'Ele', 'Ela', 'Nós', 'Vocês', 'Você', 'Isso', 'Isto', 'Aquilo',
  'Capítulo', 'Cena', 'Ato', 'Dia', 'Noite', 'Manhã', 'Tarde', 'Sim', 'Não', 'Talvez',
  'Ainda', 'Mesmo', 'Depois', 'Antes', 'Agora', 'Hoje', 'Amanhã', 'Ontem', 'Tudo', 'Nada',
  // English common non-entity sentence starters
  'The', 'This', 'That', 'These', 'Those', 'With', 'From', 'Into', 'Upon', 'When',
  'Where', 'While', 'Then', 'However', 'After', 'Before', 'Chapter', 'Scene', 'Act',
  'They', 'Them', 'There', 'Here', 'What', 'Which', 'Because', 'Although', 'Every',
]);

/**
 * Scans prose scenes offline to discover recurring capitalized proper nouns
 * (names, places, factions, or titles) missing from the Story Bible.
 */
export function scanUncatalogedCodexTerms(input: {
  scenes: readonly { id: string; content: string }[];
  knownNamesAndAliases: readonly string[];
  minMentions?: number;
}): DiscoveredCodexCandidate[] {
  const minMentions = input.minMentions ?? 2;
  const knownNormalized = new Set(
    input.knownNamesAndAliases
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length >= 2)
  );

  const buckets = new Map<
    string,
    { term: string; totalMentions: number; sceneIds: Set<string>; sampleSnippet: string }
  >();

  // Match capitalized tokens or multi-word proper names like "Voss" or "Guarda do Norte"
  const pattern = /\b([\p{Lu}][\p{L}''-]{2,}(?:\s+(?:da|do|de|das|dos|of|the)?\s*[\p{Lu}][\p{L}''-]{2,})*)\b/gu;

  for (const scene of input.scenes) {
    const cleanBody = scene.content.replace(/^#.*$/gm, '');
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(cleanBody)) !== null) {
      const candidate = match[1]?.trim();
      if (!candidate || candidate.length < 3) continue;
      if (COMMON_CAPITALIZED_STOPWORDS.has(candidate)) continue;

      const lower = candidate.toLowerCase();
      if (knownNormalized.has(lower)) continue;

      // Ignore if single-word part is already known
      const existingKnownOverlap = Array.from(knownNormalized).some(
        (known) => known.includes(lower) || lower.includes(known)
      );
      if (existingKnownOverlap) continue;

      const startIdx = Math.max(0, match.index - 35);
      const endIdx = Math.min(cleanBody.length, match.index + candidate.length + 45);
      const snippet = cleanBody.slice(startIdx, endIdx).replace(/\s+/g, ' ').trim();

      const key = lower;
      const entry = buckets.get(key);
      if (entry) {
        entry.totalMentions += 1;
        entry.sceneIds.add(scene.id);
      } else {
        buckets.set(key, {
          term: candidate,
          totalMentions: 1,
          sceneIds: new Set([scene.id]),
          sampleSnippet: snippet,
        });
      }
    }
  }

  return Array.from(buckets.values())
    .filter((entry) => entry.totalMentions >= minMentions)
    .map((entry) => ({
      term: entry.term,
      totalMentions: entry.totalMentions,
      sceneIds: Array.from(entry.sceneIds),
      sampleSnippet: entry.sampleSnippet,
    }))
    .sort((a, b) => b.totalMentions - a.totalMentions);
}
