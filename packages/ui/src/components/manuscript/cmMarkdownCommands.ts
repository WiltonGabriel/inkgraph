import { openSearchPanel } from '@codemirror/search';
import type { EditorView } from '@codemirror/view';

export type MarkdownFormatCommand =
  | 'h1'
  | 'h2'
  | 'bold'
  | 'italic'
  | 'epigraph'
  | 'checklist'
  | 'divider'
  | 'noteCallout'
  | 'secretCallout'
  | 'comment';

/** Wraps/unwraps the current selection with Markdown delimiters (e.g. **, *, %%). */
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

/** Toggles a line-level Markdown prefix (# , ## , > , - [ ] ) on the active line. */
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const text = line.text;

  if (prefix === '# ' || prefix === '## ') {
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

/** Executes a named Markdown formatting command on the active CodeMirror EditorView. */
export function runMarkdownFormatCommand(
  view: EditorView | null,
  command: MarkdownFormatCommand
): void {
  if (!view) return;

  switch (command) {
    case 'h1':
      toggleLinePrefix(view, '# ');
      break;
    case 'h2':
      toggleLinePrefix(view, '## ');
      break;
    case 'bold':
      toggleWrapSelection(view, '**', '**', 'texto em negrito');
      break;
    case 'italic':
      toggleWrapSelection(view, '*', '*', 'texto em itálico');
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

/** Opens the localized CodeMirror Find & Replace panel and focuses it. */
export function openEditorSearch(view: EditorView | null): void {
  if (!view) return;
  openSearchPanel(view);
}
