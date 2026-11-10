import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { MindMapListSidebar } from '../components/mind-map/MindMapListSidebar';
import { MindMapCanvasSvg } from '../components/mind-map/MindMapCanvasSvg';
import { MindMapNodeEditorPanel } from '../components/mind-map/MindMapNodeEditorPanel';

export function MindMapView() {
  const { project, upsertMindMap } = useProject();
  const [selectedMapId, setSelectedMapId] = useState<string>(project.mindMaps[0]?.id ?? '');
  const activeMap = project.mindMaps.find((m) => m.id === selectedMapId) ?? project.mindMaps[0];
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    activeMap?.nodes[0]?.id ?? null
  );

  const handleMoveNode = (nodeId: string, dx: number, dy: number) => {
    if (!activeMap) return;
    upsertMindMap({
      ...activeMap,
      nodes: activeMap.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, x: Math.max(60, n.x + dx), y: Math.max(50, n.y + dy) }
          : n
      ),
    });
  };

  return (
    <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 64px)', padding: 14 }}>
      <MindMapListSidebar
        selectedMapId={activeMap?.id ?? ''}
        onSelectMap={(id) => {
          setSelectedMapId(id);
          const next = project.mindMaps.find((m) => m.id === id);
          setSelectedNodeId(next?.nodes[0]?.id ?? null);
        }}
      />

      {activeMap ? (
        <>
          <MindMapCanvasSvg
            map={activeMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onMoveNode={handleMoveNode}
          />
          <MindMapNodeEditorPanel
            map={activeMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Crie um mapa mental na barra lateral.
        </div>
      )}
    </div>
  );
}
export default MindMapView;
