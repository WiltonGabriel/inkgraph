import { X, ExternalLink, FileText, Link2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface ResearchSplitPaneProps {
  binderItemId: string;
  onClose: () => void;
}

export function ResearchSplitPane({ binderItemId, onClose }: ResearchSplitPaneProps) {
  const { project, upsertBinderItem } = useProject();
  const item = project.binder.find((b) => b.id === binderItemId);

  if (!item) return null;

  return (
    <div
      style={{
        width: 340,
        backgroundColor: '#10141d',
        borderRight: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #1b202c',
          backgroundColor: '#141926',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>
          {item.type === 'link' ? <Link2 size={14} /> : <FileText size={14} />}
          <span>Abrir ao lado do manuscrito</span>
        </div>
        <button
          onClick={onClose}
          title="Fechar referência"
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        <div>
          <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
            Título do Item de Pesquisa
          </label>
          <input
            value={item.title}
            onChange={(e) => upsertBinderItem({ ...item, title: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: '#0c0f17',
              border: '1px solid #252d3d',
              borderRadius: 6,
              padding: '7px 10px',
              color: '#f3f4f6',
              fontSize: 13,
              fontWeight: 600,
            }}
          />
        </div>

        {item.type === 'link' && (
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
              URL de Referência
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={item.url ?? ''}
                onChange={(e) => upsertBinderItem({ ...item, url: e.target.value })}
                placeholder="https://..."
                style={{
                  flex: 1,
                  backgroundColor: '#0c0f17',
                  border: '1px solid #252d3d',
                  borderRadius: 6,
                  padding: '6px 10px',
                  color: '#60a5fa',
                  fontSize: 12,
                }}
              />
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '6px 8px',
                    backgroundColor: '#19202e',
                    border: '1px solid #2c3548',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
            Notas e Recortes de Pesquisa
          </label>
          <textarea
            value={item.content}
            onChange={(e) => upsertBinderItem({ ...item, content: e.target.value })}
            placeholder="Escreva notas de pesquisa, trechos históricos ou referências para consultar ao lado da cena..."
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: '#0c0f17',
              border: '1px solid #252d3d',
              borderRadius: 6,
              padding: 12,
              color: '#d1d5db',
              fontSize: 12.5,
              lineHeight: 1.6,
              resize: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
