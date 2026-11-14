import { X, ExternalLink, FileText, Link2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { sanitizeExternalUrl } from '../../domain/workspaceNormalizer';

interface ResearchSplitPaneProps {
  binderItemId: string;
  onClose: () => void;
}

export function ResearchSplitPane({ binderItemId, onClose }: ResearchSplitPaneProps) {
  const { project, upsertBinderItem } = useProject();
  const item = project.binder.find((b) => b.id === binderItemId);

  if (!item) return null;

  const safeHref = sanitizeExternalUrl(item.url);

  return (
    <aside
      aria-label="Painel lateral de pesquisa"
      style={{
        width: 340,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent-primary)',
          }}
        >
          {item.type === 'link' ? (
            <Link2 size={14} aria-hidden="true" />
          ) : (
            <FileText size={14} aria-hidden="true" />
          )}
          <span>Referência ao lado</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Fechar referência"
          aria-label="Fechar referência"
          style={{
            minWidth: 26,
            minHeight: 26,
            background: 'none',
            color: 'var(--text-secondary)',
            padding: 2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      <div
        style={{
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <div>
          <label
            htmlFor="ink-research-title"
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Título do Item de Pesquisa
          </label>
          <input
            id="ink-research-title"
            value={item.title}
            onChange={(e) => upsertBinderItem({ ...item, title: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 10px',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
            }}
          />
        </div>

        {item.type === 'link' && (
          <div>
            <label
              htmlFor="ink-research-url"
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              URL de Referência
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                id="ink-research-url"
                value={item.url ?? ''}
                onChange={(e) => upsertBinderItem({ ...item, url: e.target.value })}
                placeholder="https://..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                }}
              />
              {safeHref && (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir link externo"
                  style={{
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label
            htmlFor="ink-research-notes"
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Notas e Recortes de Pesquisa
          </label>
          <textarea
            id="ink-research-notes"
            value={item.content}
            onChange={(e) => upsertBinderItem({ ...item, content: e.target.value })}
            placeholder="Escreva notas de pesquisa, trechos históricos ou referências para consultar ao lado da cena..."
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              color: 'var(--text-primary)',
              fontSize: 12.5,
              lineHeight: 1.6,
              resize: 'none',
            }}
          />
        </div>
      </div>
    </aside>
  );
}
