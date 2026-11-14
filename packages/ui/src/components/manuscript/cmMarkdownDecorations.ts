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

const HIDE_DECO = Decoration.replace({});
const MD_MARKER_DECO = Decoration.mark({ class: 'cm-ink-md-marker' });
const BOLD_DECO = Decoration.mark({ class: 'cm-ink-bold' });
const ITALIC_DECO = Decoration.mark({ class: 'cm-ink-italic' });
const STRIKE_DECO = Decoration.mark({ class: 'cm-ink-strike' });
const INLINE_CODE_DECO = Decoration.mark({ class: 'cm-ink-inline-code' });
const COMMENT_DECO = Decoration.mark({ class: 'cm-ink-comment' });
const CHAR_DECO = Decoration.mark({ class: 'cm-ink-mention-char' });
const LOC_DECO = Decoration.mark({ class: 'cm-ink-mention-loc' });
const FACTION_DECO = Decoration.mark({ class: 'cm-ink-mention-faction' });
const OBJ_DECO = Decoration.mark({ class: 'cm-ink-mention-obj' });

interface DecoRange {
  from: number;
  to: number;
  deco: Decoration;
  isLine?: boolean;
  isReplace?: boolean;
}

function pushSyntaxWrapped(
  regex: RegExp,
  lineFrom: number,
  text: string,
  markerLen: number,
  innerDeco: Decoration,
  livePreview: boolean,
  selFrom: number,
  selTo: number,
  out: DecoRange[]
): void {
  regex.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const start = lineFrom + m.index + (m[1]?.length ?? 0);
    const token = m[2] ?? m[0];
    const end = start + token.length;
    if (end <= start + markerLen * 2) continue;

    out.push({ from: start, to: end, deco: innerDeco });
    const cursorTouches = selFrom <= end && selTo >= start;
    if (livePreview && !cursorTouches) {
      out.push({ from: start, to: start + markerLen, deco: HIDE_DECO, isReplace: true });
      out.push({ from: end - markerLen, to: end, deco: HIDE_DECO, isReplace: true });
    } else if (!livePreview) {
      out.push({ from: start, to: start + markerLen, deco: MD_MARKER_DECO });
      out.push({ from: end - markerLen, to: end, deco: MD_MARKER_DECO });
    }
  }
}

function collectLineInlineRanges(
  lineFrom: number,
  text: string,
  livePreview: boolean,
  selFrom: number,
  selTo: number,
  out: DecoRange[]
): void {
  pushSyntaxWrapped(/()(\*\*[^*\n]+\*\*)/g, lineFrom, text, 2, BOLD_DECO, livePreview, selFrom, selTo, out);
  pushSyntaxWrapped(/(^|[^*])(\*[^*\n]+\*)(?!\*)/g, lineFrom, text, 1, ITALIC_DECO, livePreview, selFrom, selTo, out);
  pushSyntaxWrapped(/()(~~[^~\n]+~~)/g, lineFrom, text, 2, STRIKE_DECO, livePreview, selFrom, selTo, out);
  pushSyntaxWrapped(/()(`[^`\n]+`)/g, lineFrom, text, 1, INLINE_CODE_DECO, livePreview, selFrom, selTo, out);

  const pushSimple = (regex: RegExp, deco: Decoration) => {
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

  pushSimple(/()(%%[^%\n]*%%)/g, COMMENT_DECO);
  pushSimple(/(^|[\s([{"'—–])(@[\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, CHAR_DECO);
  pushSimple(/(^|[\s([{"'—–])(#[\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, LOC_DECO);
  pushSimple(/(^|[\s([{"'—–])(&[\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, FACTION_DECO);
  pushSimple(/(^|[\s([{"'—–])(![\p{L}\p{N}_-]+(?:\s[\p{L}\p{N}_-]+)?)/gu, OBJ_DECO);
}

function buildProseDecorations(view: EditorView, livePreview: boolean): DecorationSet {
  const doc = view.state.doc;
  const sel = view.state.selection.main;
  const selFrom = Math.min(sel.from, sel.to);
  const selTo = Math.max(sel.from, sel.to);
  const collected: DecoRange[] = [];
  const seenLines = new Set<number>();

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = doc.lineAt(pos);
      if (!seenLines.has(line.number)) {
        seenLines.add(line.number);
        const trimmed = line.text.trim();
        const cursorOnLine = selFrom <= line.to && selTo >= line.from;

        const addLineMarkerDeco = (matchLen: number) => {
          if (matchLen <= 0 || line.from + matchLen > line.to) return;
          if (livePreview && !cursorOnLine) {
            collected.push({
              from: line.from,
              to: line.from + matchLen,
              deco: HIDE_DECO,
              isReplace: true,
            });
          } else if (!livePreview) {
            collected.push({
              from: line.from,
              to: line.from + matchLen,
              deco: MD_MARKER_DECO,
            });
          }
        };

        const h1 = line.text.match(/^(#\s+)/);
        const h2 = line.text.match(/^(##\s+)/);
        const h3 = line.text.match(/^(###\s+)/);
        const quote = line.text.match(/^(>\s?)/);

        if (h3) {
          collected.push({ from: line.from, to: line.from, deco: H3_DECO, isLine: true });
          addLineMarkerDeco(h3[1].length);
        } else if (h2) {
          collected.push({ from: line.from, to: line.from, deco: H2_DECO, isLine: true });
          addLineMarkerDeco(h2[1].length);
        } else if (h1) {
          collected.push({ from: line.from, to: line.from, deco: H1_DECO, isLine: true });
          addLineMarkerDeco(h1[1].length);
        } else if (quote) {
          collected.push({ from: line.from, to: line.from, deco: QUOTE_DECO, isLine: true });
          if (!/^>\s*\[!/.test(line.text)) {
            addLineMarkerDeco(quote[1].length);
          }
        } else if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
          collected.push({ from: line.from, to: line.from, deco: DIVIDER_DECO, isLine: true });
        }

        collectLineInlineRanges(line.from, line.text, livePreview, selFrom, selTo, collected);
      }
      if (line.to >= to || line.number >= doc.lines) break;
      pos = line.to + 1;
    }
  }

  collected.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    if (Boolean(a.isLine) !== Boolean(b.isLine)) return a.isLine ? -1 : 1;
    return a.to - b.to;
  });

  const builder = new RangeSetBuilder<Decoration>();
  let lastReplaceEnd = -1;
  for (const item of collected) {
    if (item.isReplace) {
      if (item.from < lastReplaceEnd || item.to <= item.from) continue;
      lastReplaceEnd = item.to;
    }
    builder.add(item.from, item.to, item.deco);
  }
  return builder.finish();
}

/** CodeMirror decoration plugin supporting Visual Document (livePreview) and Raw Markdown modes. */
export function createProseHighlightExtension(
  options: { livePreview?: boolean } = {}
): Extension {
  const livePreview = Boolean(options.livePreview);
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildProseDecorations(view, livePreview);
      }
      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          (livePreview && update.selectionSet)
        ) {
          this.decorations = buildProseDecorations(update.view, livePreview);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  );
}
