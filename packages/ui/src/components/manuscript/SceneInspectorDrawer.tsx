import { useState } from 'react';
import { History, MessageSquare, Sliders, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { SceneCommentsTab, SceneRevisionsTab } from './SceneCommentsRevisionsTab';
import { SceneMetaTab } from './SceneMetaTab';

interface SceneInspectorDrawerProps {
  onClose?: () => void;
}

export function SceneInspectorDrawer({ onClose }: SceneInspectorDrawerProps) {
  const { project, activeSceneId, upsertScene } = useProject();
  const [tab, setTab] = useState<'meta' | 'comments' | 'revisions'>('meta');

  const scene =
    project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
  if (!scene) return null;

  return (
    <aside
      aria-label="Inspetor da cena"
      style={{
        width: 320,
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '9px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: 2,
            }}
          >
            Inspetor · Cap. {scene.chapterNumber}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {scene.title || 'Cena sem título'}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Ocultar inspetor da cena"
            title="Ocultar inspetor (Ctrl+Shift+I)"
            style={{
              minWidth: 26,
              minHeight: 26,
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              flexShrink: 0,
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Seções do inspetor"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-subtle)',
          padding: 6,
          gap: 4,
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'meta'}
          onClick={() => setTab('meta')}
          style={{
            flex: '1 1 auto',
            minHeight: 28,
            padding: '5px 6px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: tab === 'meta' ? 'var(--bg-elevated)' : 'transparent',
            color: tab === 'meta' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Sliders size={12} aria-hidden="true" /> Metadados
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'comments'}
          onClick={() => setTab('comments')}
          style={{
            flex: '1 1 auto',
            minHeight: 28,
            padding: '5px 6px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: tab === 'comments' ? 'var(--bg-elevated)' : 'transparent',
            color: tab === 'comments' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <MessageSquare size={12} aria-hidden="true" /> Notas ({scene.comments.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'revisions'}
          onClick={() => setTab('revisions')}
          style={{
            flex: '1 1 auto',
            minHeight: 28,
            padding: '5px 6px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: tab === 'revisions' ? 'var(--bg-elevated)' : 'transparent',
            color: tab === 'revisions' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <History size={12} aria-hidden="true" /> Revisões ({scene.revisions.length})
        </button>
      </div>

      {tab === 'meta' && (
        <SceneMetaTab
          project={project}
          scene={scene}
          onUpdateScene={upsertScene}
        />
      )}

      {tab === 'comments' && (
        <SceneCommentsTab scene={scene} onUpdateScene={upsertScene} />
      )}

      {tab === 'revisions' && (
        <SceneRevisionsTab scene={scene} onUpdateScene={upsertScene} />
      )}
    </aside>
  );
}
