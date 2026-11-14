import { useMemo } from 'react';
import { Columns, FilePlus, FolderPlus, Link2, Trash2 } from 'lucide-react';
import type { BinderItem } from '../../types/project';

interface NavigatorBinderListProps {
  items: BinderItem[];
  pinnedBinderId: string | null;
  query: string;
  onPinBinderItem: (id: string | null) => void;
  onCreateBinder: (type: 'folder' | 'note' | 'link') => void;
  onDeleteBinder: (id: string) => void;
}

export function NavigatorBinderList({
  items,
  pinnedBinderId,
  query,
  onPinBinderItem,
  onCreateBinder,
  onDeleteBinder,
}: NavigatorBinderListProps) {
  const normalizedQuery = query.trim().toLowerCase();

  const filteredBinder = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter(
      (b) =>
        b.title.toLowerCase().includes(normalizedQuery) ||
        b.content.toLowerCase().includes(normalizedQuery)
    );
  }, [items, normalizedQuery]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          padding: 8,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={() => onCreateBinder('folder')}
          style={{
            flex: 1,
            minHeight: 28,
            padding: '5px 4px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <FolderPlus size={11} aria-hidden="true" /> + Pasta
        </button>
        <button
          type="button"
          onClick={() => onCreateBinder('note')}
          style={{
            flex: 1,
            minHeight: 28,
            padding: '5px 4px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <FilePlus size={11} aria-hidden="true" /> + Nota
        </button>
        <button
          type="button"
          onClick={() => onCreateBinder('link')}
          style={{
            flex: 1,
            minHeight: 28,
            padding: '5px 4px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Link2 size={11} aria-hidden="true" /> + Link
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {filteredBinder.map((item) => {
          const isPinned = pinnedBinderId === item.id;
          return (
            <div
              key={item.id}
              style={{
                padding: 8,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isPinned ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                border: isPinned
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.title}
                </span>
                <button
                  type="button"
                  aria-label={`Excluir ${item.title}`}
                  onClick={() => {
                    if (isPinned) onPinBinderItem(null);
                    onDeleteBinder(item.id);
                  }}
                  style={{
                    background: 'none',
                    color: 'var(--text-muted)',
                    padding: 2,
                  }}
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onPinBinderItem(isPinned ? null : item.id)}
                style={{
                  width: '100%',
                  minHeight: 26,
                  padding: '4px 8px',
                  backgroundColor: isPinned
                    ? 'var(--accent-primary)'
                    : 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: isPinned ? '#ffffff' : 'var(--text-primary)',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Columns size={11} aria-hidden="true" />
                {isPinned ? 'Fechar painel lateral' : 'Abrir ao lado'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
