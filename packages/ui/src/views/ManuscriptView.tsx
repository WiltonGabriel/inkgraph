import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useViewport } from '../hooks/useViewport';
import { ManuscriptNavigatorDrawer } from '../components/manuscript/ManuscriptNavigatorDrawer';
import { ResearchSplitPane } from '../components/manuscript/ResearchSplitPane';
import { ManuscriptEditorCenter } from '../components/manuscript/ManuscriptEditorCenter';
import { SceneInspectorDrawer } from '../components/manuscript/SceneInspectorDrawer';

type MobileManuscriptPane = 'indice' | 'editor' | 'inspetor';

export function ManuscriptView() {
  const { settings } = useProject();
  const { isMobile } = useViewport();
  const [pinnedBinderId, setPinnedBinderId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<MobileManuscriptPane>('editor');

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#0a0d14',
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1b202c',
            backgroundColor: '#0e1118',
            padding: '4px 8px',
            gap: 6,
            flexShrink: 0,
          }}
        >
          {(
            [
              { id: 'indice', label: settings.language === 'en' ? 'Outline' : 'Índice' },
              { id: 'editor', label: 'Editor' },
              { id: 'inspetor', label: settings.language === 'en' ? 'Inspector' : 'Inspetor' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobilePane(tab.id)}
              style={{
                flex: 1,
                minHeight: 36,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: mobilePane === tab.id ? '#1e2638' : 'transparent',
                color: mobilePane === tab.id ? '#ffffff' : '#9ca3af',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
          {mobilePane === 'indice' && (
            <ManuscriptNavigatorDrawer
              pinnedBinderId={pinnedBinderId}
              onPinBinderItem={(id) => {
                setPinnedBinderId(id);
                if (id) setMobilePane('editor');
              }}
              fullWidth
            />
          )}
          {mobilePane === 'editor' && <ManuscriptEditorCenter />}
          {mobilePane === 'inspetor' && <SceneInspectorDrawer fullWidth />}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0a0d14',
      }}
    >
      {!settings.zenMode && (
        <ManuscriptNavigatorDrawer
          pinnedBinderId={pinnedBinderId}
          onPinBinderItem={setPinnedBinderId}
        />
      )}

      {pinnedBinderId && (
        <ResearchSplitPane
          binderItemId={pinnedBinderId}
          onClose={() => setPinnedBinderId(null)}
        />
      )}

      <ManuscriptEditorCenter />

      {!settings.zenMode && <SceneInspectorDrawer />}
    </div>
  );
}
