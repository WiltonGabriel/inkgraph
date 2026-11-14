import { redo, selectAll, undo } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';
import type { EditorView } from '@codemirror/view';

export type MarkdownFormatCommand =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'normal'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'inlineCode'
  | 'bulletList'
  | 'orderedList'
  | 'epigraph'
  | 'checklist'
  | 'divider'
  | 'noteCallout'
  | 'secretCallout'
  | 'comment';

export type ActiveBlockStyle = 'normal' | 'h1' | 'h2' | 'h3' | 'quote';

export interface CursorMarkdownState {
  blockStyle: ActiveBlockStyle;
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  inlineCode: boolean;
}

/** Wraps/unwraps the current selection with Markdown delimiters (e.g. **, *, ~~, `). */
export function toggleWrapSelection(
  view: EditorView,
  prefix: string,
  suffix: string,
  placeholderText: string
): boolean {
  const { state } = view;
  const range = state.selection.main;
  const selected = state.sliceDoc(range.from, range.to);

  if (
    selected.startsWith(prefix) &&
    selected.endsWith(suffix) &&
    selected.length >= prefix.length + suffix.length
  ) {
    const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: unwrapped },
      selection: { anchor: range.from, head: range.from + unwrapped.length },
    });
    view.focus();
    return true;
  }

  // Also check immediately surrounding delimiters when user highlights inner text
  const before = state.sliceDoc(Math.max(0, range.from - prefix.length), range.from);
  const after = state.sliceDoc(range.to, Math.min(state.doc.length, range.to + suffix.length));
  if (before === prefix && after === suffix && selected.length > 0) {
    view.dispatch({
      changes: [
        { from: range.from - prefix.length, to: range.from, insert: '' },
        { from: range.to, to: range.to + suffix.length, insert: '' },
      ],
      selection: {
        anchor: range.from - prefix.length,
        head: range.to - prefix.length,
      },
    });
    view.focus();
    return true;
  }

  const inner = selected || placeholderText;
  const inserted = `${prefix}${inner}${suffix}`;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: inserted },
    selection: {
      anchor: range.from + prefix.length,
      head: range.from + prefix.length + inner.length,
    },
  });
  view.focus();
  return true;
}

/** Sets or clears a block-level style (Texto normal, H1, H2, H3, Citação) on the active line. */
export function setBlockStyle(view: EditorView | null, style: ActiveBlockStyle): boolean {
  if (!view) return false;
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const match = line.text.match(/^(#{1,3}\s+|>\s?)/);
  const existingLen = match ? match[1].length : 0;

  const prefixMap: Record<ActiveBlockStyle, string> = {
    normal: '',
    h1: '# ',
    h2: '## ',
    h3: '### ',
    quote: '> ',
  };
  const nextPrefix = prefixMap[style];

  view.dispatch({
    changes: { from: line.from, to: line.from + existingLen, insert: nextPrefix },
  });
  view.focus();
  return true;
}

/** Toggles a line-level Markdown prefix (# , ## , > , - [ ] , - , 1. ) on the active line. */
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const text = line.text;

  if (prefix === '# ' || prefix === '## ' || prefix === '### ') {
    const headingMatch = text.match(/^(#{1,3}\s+)/);
    if (headingMatch) {
      const existing = headingMatch[1];
      const replacement = existing === prefix ? '' : prefix;
      view.dispatch({
        changes: { from: line.from, to: line.from + existing.length, insert: replacement },
      });
      view.focus();
      return true;
    }
  }

  if (text.startsWith(prefix)) {
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length, insert: '' },
    });
  } else {
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: prefix },
    });
  }
  view.focus();
  return true;
}

/** Inserts a block snippet cleanly at the cursor, ensuring separation from existing prose. */
export function insertBlockSnippet(view: EditorView, snippet: string): boolean {
  const { state } = view;
  const range = state.selection.main;
  const line = state.doc.lineAt(range.from);
  const needsLeadingBreak =
    line.text.trim().length > 0 && !snippet.startsWith('\n');
  const insertText = needsLeadingBreak ? `\n\n${snippet}` : snippet;

  view.dispatch({
    changes: { from: range.from, to: range.to, insert: insertText },
    selection: { anchor: range.from + insertText.length },
  });
  view.focus();
  return true;
}

/** Inserts inline text (such as @Personagem or #Local) at the current cursor position. */
export function insertInlineText(view: EditorView | null, text: string): boolean {
  if (!view) return false;
  const { state } = view;
  const range = state.selection.main;
  const beforeChar = range.from > 0 ? state.sliceDoc(range.from - 1, range.from) : '';
  const needsLeadingSpace = beforeChar !== '' && !/[\s(\[{—–]/.test(beforeChar);
  const payload = `${needsLeadingSpace ? ' ' : ''}${text} `;

  view.dispatch({
    changes: { from: range.from, to: range.to, insert: payload },
    selection: { anchor: range.from + payload.length },
  });
  view.focus();
  return true;
}

/** Detects active Markdown block style & inline formatting at the cursor for Docs toolbar sync. */
export function inspectCursorMarkdownState(view: EditorView | null): CursorMarkdownState {
  if (!view) {
    return {
      blockStyle: 'normal',
      bold: false,
      italic: false,
      strikethrough: false,
      inlineCode: false,
    };
  }

  const { state } = view;
  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);
  const text = line.text;

  let blockStyle: ActiveBlockStyle = 'normal';
  if (/^###\s+/.test(text)) blockStyle = 'h3';
  else if (/^##\s+/.test(text)) blockStyle = 'h2';
  else if (/^#\s+/.test(text)) blockStyle = 'h1';
  else if (/^>\s?/.test(text)) blockStyle = 'quote';

  const rel = pos - line.from;
  const isInsideRegex = (regex: RegExp): boolean => {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const start = m.index + (m[1]?.length ?? 0);
      const token = m[2] ?? m[0];
      const end = start + token.length;
      if (rel >= start && rel <= end) return true;
    }
    return false;
  };

  return {
    blockStyle,
    bold: isInsideRegex(/()(\*\*[^*\n]+\*\*)/g),
    italic: isInsideRegex(/(^|[^*])(\*[^*\n]+\*)(?!\*)/g),
    strikethrough: isInsideRegex(/()(~~[^~\n]+~~)/g),
    inlineCode: isInsideRegex(/()(`[^`\n]+`)/g),
  };
}

/** Executes a named Markdown formatting command on the active CodeMirror EditorView. */
export function runMarkdownFormatCommand(
  view: EditorView | null,
  command: MarkdownFormatCommand
): void {
  if (!view) return;

  switch (command) {
    case 'normal':
      setBlockStyle(view, 'normal');
      break;
    case 'h1':
      setBlockStyle(view, 'h1');
      break;
    case 'h2':
      setBlockStyle(view, 'h2');
      break;
    case 'h3':
      setBlockStyle(view, 'h3');
      break;
    case 'bold':
      toggleWrapSelection(view, '**', '**', 'texto em negrito');
      break;
    case 'italic':
      toggleWrapSelection(view, '*', '*', 'texto em itálico');
      break;
    case 'strikethrough':
      toggleWrapSelection(view, '~~', '~~', 'texto tachado');
      break;
    case 'inlineCode':
      toggleWrapSelection(view, '`', '`', 'código');
      break;
    case 'bulletList':
      toggleLinePrefix(view, '- ');
      break;
    case 'orderedList':
      toggleLinePrefix(view, '1. ');
      break;
    case 'epigraph':
      toggleLinePrefix(view, '> ');
      break;
    case 'checklist':
      toggleLinePrefix(view, '- [ ] ');
      break;
    case 'divider':
      insertBlockSnippet(view, '\n***\n\n');
      break;
    case 'noteCallout':
      insertBlockSnippet(view, '> [!NOTA]\n> ');
      break;
    case 'secretCallout':
      insertBlockSnippet(view, '> [!SEGREDO]\n> ');
      break;
    case 'comment':
      toggleWrapSelection(view, '%% ', ' %%', 'nota do autor');
      break;
  }
}

export function undoEditor(view: EditorView | null): void {
  if (!view) return;
  undo(view);
  view.focus();
}

export function redoEditor(view: EditorView | null): void {
  if (!view) return;
  redo(view);
  view.focus();
}

export function selectAllEditor(view: EditorView | null): void {
  if (!view) return;
  selectAll(view);
  view.focus();
}

/** Opens the localized CodeMirror Find & Replace panel and focuses it. */
export function openEditorSearch(view: EditorView | null): void {
  if (!view) return;
  openSearchPanel(view);
}
