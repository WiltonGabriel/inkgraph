import { countWords } from './wordCounter';

export interface ProseStyleMetrics {
  wordCount: number;
  paragraphCount: number;
  dialogueLineCount: number;
  dialogueRatioPercent: number;
  narrationRatioPercent: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  longSentencesCount: number;
  adverbsMente: string[];
  topRepeatedWords: { word: string; count: number }[];
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  rhythmLabel: 'Ágil / Dinâmico' | 'Equilibrado' | 'Denso / Descritivo';
}

export type EditableBlockKind =
  | 'paragraph'
  | 'dialogue'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'epigraph'
  | 'callout-note'
  | 'callout-secret'
  | 'checklist'
  | 'divider'
  | 'comment'
  | 'directive';

export interface EditableChecklistItem {
  checked: boolean;
  text: string;
}

export interface EditableProseBlock {
  id: string;
  kind: EditableBlockKind;
  text: string;
  checklistItems?: EditableChecklistItem[];
}

const STOPWORDS_PT_EN = new Set([
  'que', 'para', 'com', 'não', 'uma', 'por', 'mais', 'como', 'mas', 'foi',
  'ao', 'ele', 'ela', 'das', 'tem', 'seu', 'sua', 'ou', 'ser', 'quando',
  'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela',
  'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos',
  'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você',
  'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha',
  'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós',
  'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse',
  'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu',
  'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela',
  'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles',
  'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão',
  'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos',
  'estavam', 'the', 'and', 'for', 'that', 'with', 'from', 'this', 'his',
  'her', 'was', 'were', 'had', 'not', 'but', 'into', 'she', 'him', 'they',
  'nota', 'segredo', 'sobre', 'ainda', 'onde', 'como', 'tudo', 'todos',
]);

const NON_ADVERB_MENTE = new Set([
  'mente',
  'sementes',
  'semente',
  'clemente',
  'demente',
  'dormente',
  'veemente',
]);

/** Analyzes literary prose metrics (dialogue vs narration, sentence cadence, adverbs, repetitions). */
export function analyzeProseStyle(rawMarkdown: string): ProseStyleMetrics {
  const cleaned = rawMarkdown
    .replace(/%%[\s\S]*?%%/g, '')
    .replace(/^::(beat|epistemic-reveal)\{.*\}$/gm, '');

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^(\*{3,}|-{3,}|_{3,})$/.test(l));

  const wordCount = countWords(cleaned);
  const paragraphCount = lines.filter((l) => !l.startsWith('#')).length;

  let dialogueWords = 0;
  let dialogueLineCount = 0;

  for (const line of lines) {
    if (/^[-*]\s+\[[ xX]\]/.test(line)) continue;
    const isDialogueLine =
      /^(—|--|–|\u2014)\s*\S/.test(line) ||
      /^[“"«].*[”"»]/.test(line);
    if (isDialogueLine) {
      dialogueLineCount += 1;
      dialogueWords += countWords(line);
    } else {
      const inlineQuotes = line.match(/[“"«][^”"»\n]{6,}[”"»]/g);
      if (inlineQuotes) {
        for (const q of inlineQuotes) {
          dialogueWords += countWords(q);
        }
      }
    }
  }

  const dialogueRatioPercent =
    wordCount > 0 ? Math.min(100, Math.round((dialogueWords / wordCount) * 100)) : 0;
  const narrationRatioPercent = wordCount > 0 ? 100 - dialogueRatioPercent : 0;

  const proseOnly = lines
    .filter((l) => !l.startsWith('#') && !l.startsWith('> [!'))
    .join(' ');

  const sentences = proseOnly
    .split(/[.!?…]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const sentenceCount = sentences.length;
  let longSentencesCount = 0;
  for (const s of sentences) {
    if (countWords(s) > 28) {
      longSentencesCount += 1;
    }
  }

  const avgWordsPerSentence =
    sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;

  const tokenMatches = proseOnly
    .toLowerCase()
    .match(/[\p{L}]{4,}/gu) ?? [];

  const adverbsSet = new Set<string>();
  const freqMap = new Map<string, number>();

  for (const word of tokenMatches) {
    if (
      word.length >= 7 &&
      word.endsWith('mente') &&
      !NON_ADVERB_MENTE.has(word)
    ) {
      adverbsSet.add(word);
    }
    if (word.length >= 4 && !STOPWORDS_PT_EN.has(word)) {
      freqMap.set(word, (freqMap.get(word) ?? 0) + 1);
    }
  }

  const topRepeatedWords = Array.from(freqMap.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  let rhythmLabel: ProseStyleMetrics['rhythmLabel'] = 'Equilibrado';
  if (avgWordsPerSentence > 0 && avgWordsPerSentence <= 13) {
    rhythmLabel = 'Ágil / Dinâmico';
  } else if (avgWordsPerSentence >= 22) {
    rhythmLabel = 'Denso / Descritivo';
  }

  return {
    wordCount,
    paragraphCount,
    dialogueLineCount,
    dialogueRatioPercent,
    narrationRatioPercent,
    sentenceCount,
    avgWordsPerSentence,
    longSentencesCount,
    adverbsMente: Array.from(adverbsSet).slice(0, 8),
    topRepeatedWords,
    readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 220)),
    speakingTimeMinutes: Math.max(1, Math.ceil(wordCount / 140)),
    rhythmLabel,
  };
}

/** Parses Markdown content into structured blocks for the Visual Block Editor ('Interface Visual'). */
export function parseMarkdownToEditableBlocks(source: string): EditableProseBlock[] {
  const rawLines = source.split(/\r?\n/);
  const blocks: EditableProseBlock[] = [];
  let i = 0;
  let seq = 0;
  const nextId = () => `blk_${seq++}`;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ id: nextId(), kind: 'divider', text: '***' });
      i += 1;
      continue;
    }

    if (/^%%.*%%$/.test(trimmed)) {
      blocks.push({
        id: nextId(),
        kind: 'comment',
        text: trimmed.replace(/^%%\s*/, '').replace(/\s*%%$/, ''),
      });
      i += 1;
      continue;
    }

    const h1 = trimmed.match(/^#\s+(.*)$/);
    if (h1) {
      blocks.push({ id: nextId(), kind: 'heading-1', text: h1[1] });
      i += 1;
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.*)$/);
    if (h2) {
      blocks.push({ id: nextId(), kind: 'heading-2', text: h2[1] });
      i += 1;
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.*)$/);
    if (h3) {
      blocks.push({ id: nextId(), kind: 'heading-3', text: h3[1] });
      i += 1;
      continue;
    }

    if (/^::(beat|epistemic-reveal)\{(.*)\}$/.test(trimmed)) {
      blocks.push({ id: nextId(), kind: 'directive', text: trimmed });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const firstLine = quoteLines[0] ?? '';
      const calloutMatch = firstLine.match(/^\[!(NOTA|SEGREDO)\]\s*(.*)$/i);
      if (calloutMatch) {
        const isSecret = calloutMatch[1].toUpperCase() === 'SEGREDO';
        const bodyLines = [
          ...(calloutMatch[2] ? [calloutMatch[2]] : []),
          ...quoteLines.slice(1),
        ];
        blocks.push({
          id: nextId(),
          kind: isSecret ? 'callout-secret' : 'callout-note',
          text: bodyLines.join('\n'),
        });
      } else {
        blocks.push({
          id: nextId(),
          kind: 'epigraph',
          text: quoteLines.join('\n'),
        });
      }
      continue;
    }

    if (/^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const items: EditableChecklistItem[] = [];
      while (i < rawLines.length) {
        const match = rawLines[i].trim().match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
        if (!match) break;
        items.push({
          checked: match[1].toLowerCase() === 'x',
          text: match[2],
        });
        i += 1;
      }
      blocks.push({
        id: nextId(),
        kind: 'checklist',
        text: items.map((it) => it.text).join('\n'),
        checklistItems: items,
      });
      continue;
    }

    if (/^(—|--|–)\s*/.test(trimmed)) {
      blocks.push({
        id: nextId(),
        kind: 'dialogue',
        text: trimmed.replace(/^(—|--|–)\s*/, ''),
      });
      i += 1;
      continue;
    }

    const paraLines: string[] = [];
    while (i < rawLines.length) {
      const candidate = rawLines[i].trim();
      if (
        !candidate ||
        /^(#{1,3}\s|>|%%|::(?:beat|epistemic-reveal)\{|(\*{3,}|-{3,}|_{3,})$|[-*]\s+\[[ xX]\]|(—|--|–)\s*)/i.test(
          candidate
        )
      ) {
        break;
      }
      paraLines.push(rawLines[i]);
      i += 1;
    }
    blocks.push({
      id: nextId(),
      kind: 'paragraph',
      text: paraLines.join('\n'),
    });
  }

  if (blocks.length === 0) {
    blocks.push({ id: 'blk_0', kind: 'paragraph', text: '' });
  }

  return blocks;
}

/** Serializes structured visual blocks back into canonical Markdown. */
export function serializeEditableBlocksToMarkdown(blocks: EditableProseBlock[]): string {
  const chunks: string[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case 'heading-1':
        chunks.push(`# ${block.text.trim()}`);
        break;
      case 'heading-2':
        chunks.push(`## ${block.text.trim()}`);
        break;
      case 'heading-3':
        chunks.push(`### ${block.text.trim()}`);
        break;
      case 'dialogue': {
        const clean = block.text.replace(/^(—|--|–)\s*/, '');
        chunks.push(`— ${clean}`);
        break;
      }
      case 'epigraph': {
        const lines = (block.text || '').split(/\r?\n/);
        chunks.push(lines.map((l) => `> ${l}`).join('\n'));
        break;
      }
      case 'callout-note': {
        const lines = (block.text || '').split(/\r?\n/).filter((l) => l.length > 0);
        if (lines.length === 0) {
          chunks.push('> [!NOTA]\n> ');
        } else {
          chunks.push(['> [!NOTA]', ...lines.map((l) => `> ${l}`)].join('\n'));
        }
        break;
      }
      case 'callout-secret': {
        const lines = (block.text || '').split(/\r?\n/).filter((l) => l.length > 0);
        if (lines.length === 0) {
          chunks.push('> [!SEGREDO]\n> ');
        } else {
          chunks.push(['> [!SEGREDO]', ...lines.map((l) => `> ${l}`)].join('\n'));
        }
        break;
      }
      case 'checklist': {
        const items =
          block.checklistItems && block.checklistItems.length > 0
            ? block.checklistItems
            : (block.text || '')
                .split(/\r?\n/)
                .filter((t) => t.trim().length > 0)
                .map((t) => ({ checked: false, text: t }));
        if (items.length === 0) {
          chunks.push('- [ ] Item da cena');
        } else {
          chunks.push(
            items.map((it) => `- [${it.checked ? 'x' : ' '}] ${it.text}`).join('\n')
          );
        }
        break;
      }
      case 'divider':
        chunks.push('***');
        break;
      case 'comment':
        chunks.push(`%% ${block.text.trim()} %%`);
        break;
      case 'directive':
        chunks.push(block.text.trim() || '::beat{id="beat_cena"}');
        break;
      case 'paragraph':
      default:
        chunks.push(block.text);
        break;
    }
  }

  return chunks.join('\n\n');
}
