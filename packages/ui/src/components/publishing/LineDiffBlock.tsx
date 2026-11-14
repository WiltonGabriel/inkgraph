import { useMemo } from 'react';
import {
  computeWordDiff,
  type DiffLine,
  type WordDiffToken,
} from '../../domain/gitEngine';

interface LineDiffBlockProps {
  lines: DiffLine[];
  maxHeight: number | string;
  notice?: string;
}

const INTRA_LINE_CHAR_LIMIT = 600;
const INSERT_BG = 'rgba(16, 185, 129, 0.12)';
const INSERT_STRONG_BG = 'rgba(16, 185, 129, 0.26)';
const INSERT_FG = 'color-mix(in srgb, #10b981 74%, var(--text-primary))';
const DELETE_BG = 'rgba(239, 68, 68, 0.12)';
const DELETE_STRONG_BG = 'rgba(239, 68, 68, 0.26)';
const DELETE_FG = 'color-mix(in srgb, #ef4444 74%, var(--text-primary))';

export function LineDiffBlock({ lines, maxHeight, notice }: LineDiffBlockProps) {
  const intraLineMap = useMemo(() => {
    const map = new Map<number, WordDiffToken[]>();
    for (let i = 0; i < lines.length - 1; i += 1) {
      const curr = lines[i];
      const next = lines[i + 1];
      const prevType = i > 0 ? lines[i - 1].type : null;
      const afterType = i + 2 < lines.length ? lines[i + 2].type : null;
      if (
        curr.type === 'delete' &&
        next.type === 'insert' &&
        prevType !== 'delete' &&
        afterType !== 'insert' &&
        curr.text.length <= INTRA_LINE_CHAR_LIMIT &&
        next.text.length <= INTRA_LINE_CHAR_LIMIT
      ) {
        const tokens = computeWordDiff(curr.text, next.text);
        map.set(i, tokens);
        map.set(i + 1, tokens);
      }
    }
    return map;
  }, [lines]);

  return (
    <div style={{ maxHeight, overflowY: 'auto', overflowX: 'auto' }}>
      {notice && (
        <div
          style={{
            padding: '5px 10px',
            fontSize: 11,
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {notice}
        </div>
      )}
      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11.5,
          lineHeight: 1.55,
          minWidth: '100%',
        }}
      >
        {lines.map((line, idx) => {
          const isInsert = line.type === 'insert';
          const isDelete = line.type === 'delete';
          const intraTokens = intraLineMap.get(idx);

          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '38px 38px 18px 1fr',
                backgroundColor: isInsert ? INSERT_BG : isDelete ? DELETE_BG : 'transparent',
                color: isInsert ? INSERT_FG : isDelete ? DELETE_FG : 'var(--text-secondary)',
                padding: '1px 8px 1px 0',
              }}
            >
              <span style={gutterNumStyle}>{line.oldLineNumber ?? ''}</span>
              <span style={gutterNumStyle}>{line.newLineNumber ?? ''}</span>
              <span style={{ textAlign: 'center', fontWeight: 700, userSelect: 'none' }}>
                {isInsert ? '+' : isDelete ? '-' : ' '}
              </span>
              <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {intraTokens ? (
                  <IntraLineContent tokens={intraTokens} lineType={line.type} />
                ) : line.text === '' ? (
                  ' '
                ) : (
                  line.text
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IntraLineContent({
  tokens,
  lineType,
}: {
  tokens: WordDiffToken[];
  lineType: DiffLine['type'];
}) {
  return (
    <>
      {tokens.map((tok, idx) => {
        if (tok.type === 'equal') return <span key={idx}>{tok.value}</span>;
        if (lineType === 'delete' && tok.type === 'delete') {
          return (
            <span
              key={idx}
              style={{ backgroundColor: DELETE_STRONG_BG, borderRadius: 2, textDecoration: 'line-through' }}
            >
              {tok.value}
            </span>
          );
        }
        if (lineType === 'insert' && tok.type === 'insert') {
          return (
            <span
              key={idx}
              style={{ backgroundColor: INSERT_STRONG_BG, borderRadius: 2, fontWeight: 600 }}
            >
              {tok.value}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}

const gutterNumStyle: React.CSSProperties = {
  textAlign: 'right',
  paddingRight: 6,
  color: 'var(--text-muted)',
  fontSize: 10.5,
  userSelect: 'none',
  opacity: 0.78,
};
