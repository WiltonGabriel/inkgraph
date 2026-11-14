import {
  RangeSetBuilder,
  type Extension,
} from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import type { AppSettings } from '../../types/project';

const EDITOR_FONT_STACKS: Record<AppSettings['editorFont'], string> = {
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
};

export const INKGRAPH_CM_PHRASES_PT: Record<string, string> = {
  Find: 'Localizar',
  Replace: 'Substituir',
  next: 'próximo',
  previous: 'anterior',
  all: 'todos',
  'match case': 'maiúsc./minúsc.',
  regexp: 'regex',
  'by word': 'palavra inteira',
  replace: 'substituir',
  'replace all': 'substituir tudo',
  close: 'fechar',
  'Go to line': 'Ir para linha',
  go: 'ir',
};

function resolveIsDark(settings: AppSettings): boolean {
  const mode = settings.themeBrightness ?? settings.theme;
  if (mode === 'dark') return true;
  if (mode === 'light' || mode === 'sepia') return false;
  if (typeof document !== 'undefined') {
    return document.documentElement.dataset.theme === 'dark';
  }
  return true;
}

/** Builds CodeMirror theme bindings synchronized with InkGraph typography and CSS tokens. */
export function buildInkGraphEditorTheme(settings: AppSettings): Extension {
  const maxWidth = settings.zenMode ? '760px' : `${settings.editorMaxWidthCh || 74}ch`;
  const fontFamily = EDITOR_FONT_STACKS[settings.editorFont] ?? EDITOR_FONT_STACKS.serif;
  const fontSize = `${settings.editorFontSize || 17}px`;
  const lineHeight = String(settings.editorLineHeight || 1.8);
  const paragraphSpacing = `${settings.editorParagraphSpacingPx ?? 10}px`;
  const verticalPad = settings.typewriterMode ? '38vh' : '28px';

  return EditorView.theme(
    {
      '&': {
        height: '100%',
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        fontFamily,
        fontSize,
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'inherit',
        lineHeight,
        scrollPaddingBlock: settings.typewriterMode ? '34vh' : '24px',
      },
      '.cm-content': {
        maxWidth,
        width: '100%',
        margin: '0 auto',
        padding: `${verticalPad} 32px`,
        caretColor: 'var(--accent-primary)',
        textAlign: settings.editorTextAlign || 'left',
        minHeight: '100%',
      },
      '.cm-line': {
        padding: `0 0 ${paragraphSpacing} 0`,
        textIndent: settings.paragraphIndent ? '2em' : '0',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--accent-primary)',
        borderLeftWidth: '2px',
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--accent-soft) !important',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent',
      },
      '.cm-placeholder': {
        color: 'var(--text-muted)',
        fontStyle: 'italic',
      },
      '.cm-ink-dimmed-line': {
        opacity: '0.42',
        transition: 'opacity 150ms ease',
      },
      '.cm-ink-heading-1': {
        fontSize: '1.45em',
        fontWeight: '700',
        color: 'var(--text-primary)',
        textIndent: '0 !important',
        letterSpacing: '-0.01em',
      },
      '.cm-ink-heading-2': {
        fontSize: '1.22em',
        fontWeight: '700',
        color: 'var(--text-primary)',
        textIndent: '0 !important',
      },
      '.cm-ink-heading-3': {
        fontSize: '1.08em',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        textIndent: '0 !important',
      },
      '.cm-ink-blockquote': {
        borderLeft: '3px solid var(--accent-primary)',
        paddingLeft: '14px !important',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        textIndent: '0 !important',
      },
      '.cm-ink-divider': {
        color: 'var(--accent-primary)',
        textAlign: 'center',
        letterSpacing: '0.3em',
        textIndent: '0 !important',
      },
      '.cm-ink-bold': {
        fontWeight: '700',
      },
      '.cm-ink-italic': {
        fontStyle: 'italic',
      },
      '.cm-ink-comment': {
        color: 'var(--text-muted)',
        fontFamily: EDITOR_FONT_STACKS.mono,
        fontSize: '0.88em',
      },
      '.cm-ink-mention-char': {
        color: 'var(--accent-primary)',
        backgroundColor: 'var(--accent-soft)',
        borderRadius: '4px',
        padding: '0 3px',
      },
      '.cm-ink-mention-loc': {
        color: 'var(--success)',
        backgroundColor: 'color-mix(in srgb, var(--success) 14%, transparent)',
        borderRadius: '4px',
        padding: '0 3px',
      },
      '.cm-ink-mention-faction': {
        color: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.14)',
        borderRadius: '4px',
        padding: '0 3px',
      },
      '.cm-ink-mention-obj': {
        color: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.14)',
        borderRadius: '4px',
        padding: '0 3px',
      },
      '.cm-panels': {
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-subtle)',
      },
      '.cm-panels.cm-panels-top': {
        borderBottom: '1px solid var(--border-subtle)',
      },
      '.cm-panel.cm-search': {
        padding: '8px 14px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--ui-font)',
        fontSize: '12px',
      },
      '.cm-panel.cm-search input.cm-textfield': {
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px 8px',
        fontSize: '12px',
      },
      '.cm-panel.cm-search button.cm-button': {
        backgroundImage: 'none',
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px 8px',
        fontSize: '11.5px',
        cursor: 'pointer',
      },
      '.cm-panel.cm-search button[name="close"]': {
        color: 'var(--text-secondary)',
        fontSize: '16px',
        padding: '2px 6px',
      },
      '.cm-panel.cm-search label': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--text-secondary)',
        fontSize: '11.5px',
      },
      '.cm-tooltip.cm-tooltip-autocomplete': {
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)',
        fontFamily: 'var(--ui-font)',
        fontSize: '12.5px',
        overflow: 'hidden',
      },
      '.cm-tooltip-autocomplete > ul > li': {
        padding: '5px 10px',
      },
      '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent-primary)',
        color: '#ffffff',
      },
      '.cm-completionDetail': {
        opacity: '0.78',
        fontSize: '11px',
        marginLeft: '10px',
      },
    },
    { dark: resolveIsDark(settings) }
  );
}

const DIM_LINE_DECO = Decoration.line({ class: 'cm-ink-dimmed-line' });

function computeFocusDecorations(view: EditorView): DecorationSet {
  const { doc, selection } = view.state;
  const cursorLine = doc.lineAt(selection.main.head);
  let activeStart = cursorLine.number;
  let activeEnd = cursorLine.number;

  if (cursorLine.text.trim().length > 0) {
    while (activeStart > 1 && doc.line(activeStart - 1).text.trim().length > 0) {
      activeStart -= 1;
    }
    while (activeEnd < doc.lines && doc.line(activeEnd + 1).text.trim().length > 0) {
      activeEnd += 1;
    }
  }

  const builder = new RangeSetBuilder<Decoration>();
  let lastLineNumber = -1;

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = doc.lineAt(pos);
      if (line.number > lastLineNumber) {
        lastLineNumber = line.number;
        if (line.number < activeStart || line.number > activeEnd) {
          builder.add(line.from, line.from, DIM_LINE_DECO);
        }
      }
      if (line.to >= to || line.number >= doc.lines) break;
      pos = line.to + 1;
    }
  }

  return builder.finish();
}

/** Dims non-active paragraphs to 0.42 opacity when Focus Mode is active. */
export function createFocusModeExtension(enabled: boolean): Extension {
  if (!enabled) return [];

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = computeFocusDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = computeFocusDecorations(update.view);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  );
}

/** Smooth-centers the active cursor line vertically inside the editor scroller. */
export function createTypewriterExtension(
  enabled: boolean,
  reducedMotion: boolean
): Extension {
  if (!enabled) return [];

  return EditorView.updateListener.of((update) => {
    if (!update.selectionSet && !update.docChanged) return;
    if (!update.view.hasFocus) return;

    const view = update.view;
    requestAnimationFrame(() => {
      const head = view.state.selection.main.head;
      const scroller = view.scrollDOM;
      const scrollerRect = scroller.getBoundingClientRect();
      if (scrollerRect.height <= 0) return;

      const coords = view.coordsAtPos(head);
      if (coords) {
        const lineMid = (coords.top + coords.bottom) / 2;
        const scrollerMid = scrollerRect.top + scrollerRect.height / 2;
        const delta = lineMid - scrollerMid;
        if (Math.abs(delta) > 6) {
          scroller.scrollBy({
            top: delta,
            behavior: reducedMotion ? 'auto' : 'smooth',
          });
        }
        return;
      }

      const block = view.lineBlockAt(head);
      const targetTop = Math.max(0, block.top - scrollerRect.height / 2 + block.height / 2);
      scroller.scrollTo({
        top: targetTop,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    });
  });
}
