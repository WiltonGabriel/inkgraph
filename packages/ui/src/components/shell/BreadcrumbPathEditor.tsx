import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, CornerDownLeft, FolderOpen } from 'lucide-react';
import { BREADCRUMB_TARGETS } from '../../domain/breadcrumbResolver';

interface BreadcrumbPathEditorProps {
  initialPath: string;
  navigationHistory: string[];
  onSubmitPath: (rawPath: string) => boolean;
  onCancel: () => void;
}

interface SuggestionItem {
  path: string;
  source: 'recent' | 'target';
  hint?: string;
}

function normalizeQuery(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function stripRootPrefix(path: string): string {
  return path.replace(/^InkGraph\s*\/\s*/i, '');
}

export function BreadcrumbPathEditor({
  initialPath,
  navigationHistory,
  onSubmitPath,
  onCancel,
}: BreadcrumbPathEditorProps) {
  const [value, setValue] = useState(initialPath);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const suggestions = useMemo<SuggestionItem[]>(() => {
    const normInitial = normalizeQuery(initialPath);
    const normValue = normalizeQuery(value);
    const isUnmodified = normValue === '' || normValue === normInitial;
    const stripped = normValue.replace(/^inkgraph\s*\/\s*/i, '');
    const lastToken = stripped.split('/').pop()?.trim() ?? stripped;

    const seen = new Set<string>();
    const combined: SuggestionItem[] = [];

    for (const hist of navigationHistory) {
      const displayHist = stripRootPrefix(hist);
      if (seen.has(displayHist)) continue;
      if (isUnmodified || normalizeQuery(displayHist).includes(stripped) || normalizeQuery(displayHist).includes(lastToken)) {
        seen.add(displayHist);
        combined.push({ path: displayHist, source: 'recent' });
      }
    }

    for (const target of BREADCRUMB_TARGETS) {
      const displayPath = stripRootPrefix(target.canonicalPath);
      if (seen.has(displayPath)) continue;
      const matchCanon = normalizeQuery(displayPath).includes(stripped);
      const matchAlias = target.aliases.some((alias) => {
        const normAlias = normalizeQuery(alias);
        return normAlias.includes(stripped) || (lastToken.length > 0 && normAlias.includes(lastToken));
      });

      if (isUnmodified || matchCanon || matchAlias) {
        seen.add(displayPath);
        combined.push({
          path: displayPath,
          source: 'target',
          hint: target.aliases[0],
        });
      }
    }

    return combined.slice(0, 9);
  }, [initialPath, navigationHistory, value]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  const submitValue = (raw: string) => {
    onSubmitPath(raw);
    onCancel();
  };

  return (
    <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200, maxWidth: 560 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
          border: '1px solid var(--accent-primary, #3b82f6)',
          borderRadius: 'var(--radius-sm, 6px)',
          padding: '3px 8px',
          boxShadow: '0 0 0 2px var(--accent-soft, rgba(59, 130, 246, 0.14))',
        }}
      >
        <FolderOpen size={12} style={{ color: 'var(--accent-primary, #3b82f6)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onCancel}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                suggestions.length === 0 ? -1 : (prev + 1) % suggestions.length
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                suggestions.length === 0 ? -1 : (prev - 1 + suggestions.length) % suggestions.length
              );
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                submitValue(suggestions[highlightedIndex].path);
              } else {
                submitValue(value);
              }
            }
          }}
          aria-label="Navegar por caminho de pasta"
          placeholder="Planejamento / Painel"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: 12,
            fontWeight: 500,
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted, #64748b)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
          }}
        >
          <CornerDownLeft size={10} /> Enter
        </span>
      </div>

      {suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Sugestões de caminho"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 160,
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 14px 32px rgba(0, 0, 0, 0.35)',
            padding: 4,
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((item, idx) => {
            const active = idx === highlightedIndex;
            return (
              <button
                key={`${item.source}_${item.path}`}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  submitValue(item.path);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: 'none',
                  backgroundColor: active ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))' : 'transparent',
                  color: active ? 'var(--accent-primary, #3b82f6)' : 'var(--text-primary, #f1f5f9)',
                  fontSize: 11.5,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.source === 'recent' ? (
                    <Clock size={11} style={{ color: 'var(--text-muted, #64748b)', flexShrink: 0 }} />
                  ) : (
                    <FolderOpen size={11} style={{ color: 'var(--text-muted, #64748b)', flexShrink: 0 }} />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.path}</span>
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted, #64748b)',
                    flexShrink: 0,
                  }}
                >
                  {item.source === 'recent' ? 'Recente' : item.hint}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
