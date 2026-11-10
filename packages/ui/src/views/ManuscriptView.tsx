import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { ManuscriptNavigatorDrawer } from '../components/manuscript/ManuscriptNavigatorDrawer';
import { ResearchSplitPane } from '../components/manuscript/ResearchSplitPane';
import { ManuscriptEditorCenter } from '../components/manuscript/ManuscriptEditorCenter';
import { SceneInspectorDrawer } from '../components/manuscript/SceneInspectorDrawer';

export function ManuscriptView() {
  const { settings } = useProject();
  const [pinnedBinderId, setPinnedBinderId] = useState<string | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 46px)',
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
