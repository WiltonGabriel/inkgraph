import type { ReadabilityLocale } from './textMetrics';
import { countWords } from './textMetrics';

export type HeuristicRuleId =
  | 'lexical_repetition'
  | 'overlong_scene'
  | 'missing_act2_midpoint'
  | 'premature_secret_or_intro'
  | 'sudden_tension_drop'
  | 'filter_word_density'
  | 'dialogue_imbalance'
  | 'unclosed_thread';

export interface HeuristicSceneInput {
  readonly id: string;
  readonly chapterNumber: number;
  readonly title: string;
  readonly content: string;
  readonly act: number;
  readonly tension: number;
  readonly povCharacterId?: string;
  readonly locationId?: string;
  readonly subplotIds: readonly string[];
}

export interface HeuristicSecretInput {
  readonly ownerId: string;
  readonly ownerName: string;
  readonly secret: string;
  readonly knownByIds: readonly string[];
  readonly revealedInSceneId?: string;
}

export interface HeuristicSubplotInput {
  readonly id: string;
  readonly name: string;
}

export interface StructuralDiagnostic {
  readonly id: string;
  readonly ruleId: HeuristicRuleId;
  readonly severity: 'error' | 'warn' | 'info';
  readonly sceneId?: string;
  readonly title: string;
  readonly description: string;
}

const PT_FILTER_WORDS = [
  'muito', 'realmente', 'basicamente', 'apenas', 'simplesmente', 'parecia',
  'sentiu', 'viu', 'ouviu', 'notou', 'percebeu', 'achou', 'pensou',
];

const EN_FILTER_WORDS = [
  'really', 'just', 'very', 'basically', 'simply', 'seemed', 'felt',
  'saw', 'heard', 'noticed', 'realized', 'thought', 'wondered',
];

export interface FilterWordMatch {
  readonly word: string;
  readonly count: number;
}

export function scanFilterWords(
  text: string,
  locale: ReadabilityLocale = 'pt-BR'
): { matches: FilterWordMatch[]; totalHits: number; perThousandWords: number } {
  const words = countWords(text);
  if (words === 0) return { matches: [], totalHits: 0, perThousandWords: 0 };

  const lexicon = locale === 'en' ? EN_FILTER_WORDS : PT_FILTER_WORDS;
  const normalized = text.toLowerCase();
  const matches: FilterWordMatch[] = [];
  let totalHits = 0;

  for (const term of lexicon) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const found = normalized.match(regex);
    if (found && found.length > 0) {
      matches.push({ word: term, count: found.length });
      totalHits += found.length;
    }
  }

  return {
    matches: matches.sort((a, b) => b.count - a.count),
    totalHits,
    perThousandWords: Math.round((totalHits / Math.max(1, words)) * 1000),
  };
}

function jaccardTokenSimilarity(a: string, b: string): number {
  const tokensA = new Set((a.toLowerCase().match(/[\p{L}]{4,}/gu) ?? []));
  const tokensB = new Set((b.toLowerCase().match(/[\p{L}]{4,}/gu) ?? []));
  if (tokensA.size < 4 || tokensB.size < 4) return 0;

  let intersection = 0;
  for (const tok of tokensA) {
    if (tokensB.has(tok)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Evaluates all 8 deterministic structural & continuity rules completely offline.
 */
export function runAllNarrativeHeuristics(input: {
  scenes: readonly HeuristicSceneInput[];
  secrets: readonly HeuristicSecretInput[];
  subplots: readonly HeuristicSubplotInput[];
  locale?: ReadabilityLocale;
}): StructuralDiagnostic[] {
  const diagnostics: StructuralDiagnostic[] = [];
  const locale = input.locale ?? 'pt-BR';
  const isEn = locale === 'en';
  const sceneIndexById = new Map<string, number>();
  input.scenes.forEach((s, idx) => sceneIndexById.set(s.id, idx));

  // Rule 1: Lexical repetition between consecutive paragraphs
  for (const scene of input.scenes) {
    const paragraphs = scene.content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 40);
    for (let i = 1; i < paragraphs.length; i += 1) {
      const sim = jaccardTokenSimilarity(paragraphs[i - 1]!, paragraphs[i]!);
      if (sim >= 0.42) {
        diagnostics.push({
          id: `rep_${scene.id}_${i}`,
          ruleId: 'lexical_repetition',
          severity: 'warn',
          sceneId: scene.id,
          title: isEn ? `Lexical repetition in "${scene.title}"` : `Repetição lexical em "${scene.title}"`,
          description: isEn
            ? `Paragraphs ${i} and ${i + 1} share ${Math.round(sim * 100)}% vocabulary overlap.`
            : `Os parágrafos ${i} e ${i + 1} compartilham ${Math.round(sim * 100)}% do vocabulário.`,
        });
        break;
      }
    }
  }

  // Rule 2: Overlong scene pacing check
  for (const scene of input.scenes) {
    const wc = countWords(scene.content);
    if (wc > 4500) {
      diagnostics.push({
        id: `long_${scene.id}`,
        ruleId: 'overlong_scene',
        severity: 'info',
        sceneId: scene.id,
        title: isEn ? `Long scene (${wc} words)` : `Cena extensa (${wc} palavras)`,
        description: isEn
          ? `"${scene.title}" exceeds 4,500 words; consider splitting into chapters or adding a breather beat.`
          : `"${scene.title}" ultrapassa 4.500 palavras; avalie dividir a cena ou inserir respiro.`,
      });
    }
  }

  // Rule 3: Missing Act II Midpoint anchor
  const act2Scenes = input.scenes.filter((s) => s.act === 2);
  if (act2Scenes.length >= 2 && !act2Scenes.some((s) => s.tension >= 65)) {
    diagnostics.push({
      id: 'act2_midpoint',
      ruleId: 'missing_act2_midpoint',
      severity: 'warn',
      title: isEn ? 'Act II lacks a tension midpoint' : 'Ato II sem ponto de virada (Midpoint)',
      description: isEn
        ? 'No Act II scene reaches >= 65% tension to anchor the narrative midpoint.'
        : 'Nenhuma cena do Ato II atinge >= 65% de tensão para sustentar o midpoint.',
    });
  }

  // Rule 4: Premature epistemic secret exposure before reveal scene
  for (const sec of input.secrets) {
    if (!sec.revealedInSceneId) continue;
    const revealIdx = sceneIndexById.get(sec.revealedInSceneId);
    if (revealIdx === undefined) continue;

    const secretKeywords = sec.secret
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 5);
    if (secretKeywords.length === 0) continue;

    for (let i = 0; i < revealIdx; i += 1) {
      const earlyScene = input.scenes[i]!;
      const povKnows = earlyScene.povCharacterId && sec.knownByIds.includes(earlyScene.povCharacterId);
      if (povKnows) continue;
      const bodyLower = earlyScene.content.toLowerCase();
      const hits = secretKeywords.filter((kw) => bodyLower.includes(kw));
      if (hits.length >= Math.min(2, secretKeywords.length)) {
        diagnostics.push({
          id: `ep_${sec.ownerId}_${earlyScene.id}`,
          ruleId: 'premature_secret_or_intro',
          severity: 'error',
          sceneId: earlyScene.id,
          title: isEn ? `Possible epistemic leak in "${earlyScene.title}"` : `Possível vazamento epistêmico em "${earlyScene.title}"`,
          description: isEn
            ? `Terms from ${sec.ownerName}'s secret appear before its reveal in scene ${revealIdx + 1}.`
            : `Termos do segredo de ${sec.ownerName} surgem antes da cena de revelação (${revealIdx + 1}).`,
        });
      }
    }
  }

  // Rule 5: Sudden tension drop >= 25 points
  for (let i = 1; i < input.scenes.length; i += 1) {
    const prev = input.scenes[i - 1]!;
    const curr = input.scenes[i]!;
    if (prev.tension - curr.tension >= 25) {
      diagnostics.push({
        id: `drop_${curr.id}`,
        ruleId: 'sudden_tension_drop',
        severity: 'warn',
        sceneId: curr.id,
        title: isEn ? `Sharp tension drop into "${curr.title}"` : `Queda brusca de tensão em "${curr.title}"`,
        description: `${prev.tension}% -> ${curr.tension}% (-${prev.tension - curr.tension}).`,
      });
    }
  }

  // Rule 6: Filter-word density >= 22 per 1000 words
  for (const scene of input.scenes) {
    const wc = countWords(scene.content);
    if (wc < 40) continue;
    const fw = scanFilterWords(scene.content, locale);
    if (fw.perThousandWords >= 22) {
      diagnostics.push({
        id: `fw_${scene.id}`,
        ruleId: 'filter_word_density',
        severity: 'info',
        sceneId: scene.id,
        title: isEn ? `High filter-word density in "${scene.title}"` : `Excesso de palavras-muleta em "${scene.title}"`,
        description: `${fw.perThousandWords}‰ (${fw.matches.slice(0, 3).map((m) => m.word).join(', ')}).`,
      });
    }
  }

  // Rule 7: Dialogue imbalance in dense dramatic scenes
  for (const scene of input.scenes) {
    const wc = countWords(scene.content);
    if (wc < 600 || scene.tension < 65) continue;
    const lines = scene.content.split('\n').filter((l) => l.trim().length > 0);
    const dlgLines = lines.filter((l) => /^[-—"|«“]/.test(l.trim()) || l.includes('—') || l.includes('"'));
    const ratio = lines.length > 0 ? dlgLines.length / lines.length : 0;
    if (ratio < 0.05) {
      diagnostics.push({
        id: `dlg_${scene.id}`,
        ruleId: 'dialogue_imbalance',
        severity: 'info',
        sceneId: scene.id,
        title: isEn ? `Low dialogue density in climax "${scene.title}"` : `Pouco diálogo no pico dramático de "${scene.title}"`,
        description: isEn
          ? 'High-tension long scene is >95% exposition without spoken exchange.'
          : 'Cena longa de alta tensão contém >95% de narração sem trocas de diálogo.',
      });
    }
  }

  // Rule 8: Unclosed subplot thread or missing POV/Location
  for (const sp of input.subplots) {
    const linked = input.scenes.filter((s) => s.subplotIds.includes(sp.id));
    if (linked.length > 0 && !linked.some((s) => s.act >= 3)) {
      diagnostics.push({
        id: `thread_${sp.id}`,
        ruleId: 'unclosed_thread',
        severity: 'warn',
        title: isEn ? `Open subplot "${sp.name}" missing Act III payoff` : `Subtrama "${sp.name}" sem fechamento no Ato III`,
        description: isEn
          ? `${linked.length} scene(s) reference this subplot without an Act III resolution scene.`
          : `${linked.length} cena(s) usam esta subtrama, mas nenhuma está no Ato III.`,
      });
    }
  }

  return diagnostics;
}
