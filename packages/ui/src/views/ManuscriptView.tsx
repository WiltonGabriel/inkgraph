import { useEffect, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { ManuscriptNavigatorDrawer } from '../components/manuscript/ManuscriptNavigatorDrawer';
import { ResearchSplitPane } from '../components/manuscript/ResearchSplitPane';
import { ManuscriptEditorCenter } from '../components/manuscript/ManuscriptEditorCenter';
import { SceneInspectorDrawer } from '../components/manuscript/SceneInspectorDrawer';

export function ManuscriptView() {
  const { settings } = useProject();
  const [pinnedBinderId, setPinnedBinderId] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Listen to global App shortcut dispatcher for toggleSceneInspector.
  useEffect(() => {
    const handleShortcut = (ev: Event) => {
      const action = (ev as CustomEvent<{ action?: string }>).detail?.action;
      if (action === 'toggleSceneInspector') {
        setShowInspector((prev) => !prev);
      }
    };
    window.addEventListener('inkgraph:shortcut', handleShortcut);
    return () => window.removeEventListener('inkgraph:shortcut', handleShortcut);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
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

      <ManuscriptEditorCenter
        inspectorOpen={showInspector}
        onToggleInspector={() => setShowInspector((prev) => !prev)}
      />

      {!settings.zenMode && showInspector && (
        <SceneInspectorDrawer onClose={() => setShowInspector(false)} />
      )}
    </div>
  );
}
