import { RangeSetBuilder, type Extension } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';

const H1_DECO = Decoration.line({ class: 'cm-ink-heading-1' });
const H2_DECO = Decoration.line({ class: 'cm-ink-heading-2' });
const H3_DECO = Decoration.line({ class: 'cm-ink-heading-3' });
const QUOTE_DECO = Decoration.line({ class: 'cm-ink-blockquote' });
const DIVIDER_DECO = Decoration.line({ class: 'cm-ink-divider' });

const BOLD_DECO = Decoration.mark({ class: 'cm-ink-bold' });
const ITALIC_DECO = Decoration.mark({ class: 'cm-ink-italic' });
const COMMENT_DECO = Decoration.mark({ class: 'cm-ink-comment' });
const CHAR_DECO = Decoration.mark({ class: 'cm-ink-mention-char' });
const LOC_DECO = Decoration.mark({ class: 'cm-ink-mention-loc' });
const FACTION_DECO = Decoration.mark({ class: 'cm-ink-mention-faction' });
const OBJ_DECO = Decoration.mark({ class: 'cm-ink-mention-obj' });

interface DecoRange {
  from: number;
  to: number;
  deco: Decoration;
}

function collectLineInlineRanges(
  lineFrom: number,
  text: string,
  out: DecoRange[]
): void {
  const pushMatches = (regex: RegExp, deco: Decoration) => {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const start = lineFrom + m.index + (m[1]?.length ?? 0);
      const token = m[2] ?? m[0];
      const end = start + token.length;
      if (end > start) {
        out.push({ from: start, to: end, deco });
      }
    }
  };

  pushMatches(/()(\*\*[^*\n]+\*\*)/g, BOLD_DECO);
  pushMatches(/(^|[^*])(\*[^*\n]+\*)(?!\*)/g, ITALIC_DECO);
  pushMatches(/()(%%[^%\n]*%%)/g, COMMENT_DECO);
  pushMatches(/(^|[\s([{"'—–])(@[\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, CHAR_DECO);
  pushMatches(/(^|[\s([{"'—–])(#[\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, LOC_DECO);
  pushMatches(/(^|[\s([{"'—–])(&[\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, FACTION_DECO);
  pushMatches(/(^|[\s([{"'—–])(![\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, OBJ_DECO);
}

function buildProseDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;
  const collected: DecoRange[] = [];
  const seenLines = new Set<number>();

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = doc.lineAt(pos);
      if (!seenLines.has(line.number)) {
        seenLines.add(line.number);
        const trimmed = line.text.trim();

        if (/^#\s+/.test(line.text)) {
          collected.push({ from: line.from, to: line.from, deco: H1_DECO });
        } else if (/^##\s+/.test(line.text)) {
          collected.push({ from: line.from, to: line.from, deco: H2_DECO });
        } else if (/^###\s+/.test(line.text)) {
          collected.push({ from: line.from, to: line.from, deco: H3_DECO });
        } else if (/^>\s?/.test(line.text)) {
          collected.push({ from: line.from, to: line.from, deco: QUOTE_DECO });
        } else if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
          collected.push({ from: line.from, to: line.from, deco: DIVIDER_DECO });
        }

        collectLineInlineRanges(line.from, line.text, collected);
      }
      if (line.to >= to || line.number >= doc.lines) break;
      pos = line.to + 1;
    }
  }

  collected.sort((a, b) => a.from - b.from || a.to - b.to);

  const builder = new RangeSetBuilder<Decoration>();
  for (const item of collected) {
    builder.add(item.from, item.to, item.deco);
  }
  return builder.finish();
}

/** Lightweight CodeMirror decoration plugin for literary Markdown and entity tags. */
export function createProseHighlightExtension(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildProseDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildProseDecorations(update.view);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  );
}
