import type { WordDiffToken } from '../../domain/gitEngine';

interface WordDiffBlockProps {
  tokens: WordDiffToken[];
  maxHeight: number | string;
}

const INSERT_STRONG_BG = 'rgba(16, 185, 129, 0.26)';
const INSERT_FG = 'color-mix(in srgb, #10b981 74%, var(--text-primary))';
const DELETE_STRONG_BG = 'rgba(239, 68, 68, 0.26)';
const DELETE_FG = 'color-mix(in srgb, #ef4444 74%, var(--text-primary))';

export function WordDiffBlock({ tokens, maxHeight }: WordDiffBlockProps) {
  return (
    <div
      style={{
        maxHeight,
        overflowY: 'auto',
        padding: '10px 12px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: 'var(--text-primary)',
      }}
    >
      {tokens.map((tok, idx) => {
        if (tok.type === 'equal') {
          return <span key={idx}>{tok.value}</span>;
        }
        if (tok.type === 'insert') {
          return (
            <ins
              key={idx}
              style={{
                backgroundColor: INSERT_STRONG_BG,
                color: INSERT_FG,
                textDecoration: 'none',
                borderRadius: 3,
                padding: '1px 2px',
              }}
            >
              {tok.value}
            </ins>
          );
        }
        return (
          <del
            key={idx}
            style={{
              backgroundColor: DELETE_STRONG_BG,
              color: DELETE_FG,
              textDecoration: 'line-through',
              borderRadius: 3,
              padding: '1px 2px',
            }}
          >
            {tok.value}
          </del>
        );
      })}
    </div>
  );
}
