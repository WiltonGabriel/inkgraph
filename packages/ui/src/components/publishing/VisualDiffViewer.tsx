import { useMemo, useState } from 'react';
import {
  computeLineDiff,
  computeWordDiff,
  type DiffLine,
  type WordDiffToken,
} from '../../domain/gitEngine';
import { LineDiffBlock } from './LineDiffBlock';
import { WordDiffBlock } from './WordDiffBlock';

export interface VisualDiffViewerProps {
  baseText: string;
  targetText: string;
  precomputedLines?: DiffLine[];
  defaultMode?: 'lines' | 'words';
  allowModeToggle?: boolean;
  maxHeight?: number | string;
  emptyMessage?: string;
}

const WORD_DIFF_CHAR_LIMIT = 15000;
const INSERT_FG = 'color-mix(in srgb, #10b981 74%, var(--text-primary))';
const DELETE_FG = 'color-mix(in srgb, #ef4444 74%, var(--text-primary))';

export function VisualDiffViewer({
  baseText,
  targetText,
  precomputedLines,
  defaultMode = 'lines',
  allowModeToggle = true,
  maxHeight = 280,
  emptyMessage = 'Sem alterações textuais.',
}: VisualDiffViewerProps) {
  const [mode, setMode] = useState<'lines' | 'words'>(defaultMode);

  const lines = useMemo(
    () => precomputedLines ?? computeLineDiff(baseText, targetText),
    [precomputedLines, baseText, targetText]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of lines) {
      if (line.type === 'insert') added += 1;
      else if (line.type === 'delete') removed += 1;
    }
    return { added, removed };
  }, [lines]);

  const wordDiffTooLarge = baseText.length + targetText.length > WORD_DIFF_CHAR_LIMIT;

  const wordTokens = useMemo<WordDiffToken[] | null>(() => {
    if (mode !== 'words' || wordDiffTooLarge) return null;
    return computeWordDiff(baseText, targetText);
  }, [mode, wordDiffTooLarge, baseText, targetText]);

  if (lines.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm, 6px)',
          padding: '0.75rem',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm, 6px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '6px 10px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: INSERT_FG, fontWeight: 600 }}>
            +{stats.added} {stats.added === 1 ? 'linha' : 'linhas'}
          </span>
          <span style={{ color: DELETE_FG, fontWeight: 600 }}>
            -{stats.removed} {stats.removed === 1 ? 'linha' : 'linhas'}
          </span>
          {stats.added === 0 && stats.removed === 0 && (
            <span style={{ color: 'var(--text-muted)' }}>Idêntico</span>
          )}
        </div>

        {allowModeToggle && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => setMode('lines')}
              style={toggleBtnStyle(mode === 'lines')}
            >
              Linhas
            </button>
            <button
              type="button"
              onClick={() => setMode('words')}
              style={toggleBtnStyle(mode === 'words')}
            >
              Palavras
            </button>
          </div>
        )}
      </div>

      {mode === 'words' && wordTokens ? (
        <WordDiffBlock tokens={wordTokens} maxHeight={maxHeight} />
      ) : (
        <LineDiffBlock
          lines={lines}
          maxHeight={maxHeight}
          notice={
            mode === 'words' && wordDiffTooLarge
              ? 'Texto extenso: exibindo comparação otimizada por linhas.'
              : undefined
          }
        />
      )}
    </div>
  );
}

const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '2px 8px',
  borderRadius: 'var(--radius-sm, 6px)',
  fontSize: 11,
  fontWeight: active ? 600 : 500,
  backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
  border: active ? '1px solid var(--accent-primary)' : '1px solid transparent',
});
