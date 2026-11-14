import { useCallback, useState } from 'react';
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

  const handleMoveNode = useCallback(
    (nodeId: string, dx: number, dy: number) => {
      if (!activeMap) return;
      upsertMindMap({
        ...activeMap,
        nodes: activeMap.nodes.map((n) =>
          n.id === nodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n
        ),
      });
    },
    [activeMap, upsertMindMap]
  );

  const handleCreateEdge = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      if (!activeMap || fromNodeId === toNodeId) return;
      upsertMindMap({
        ...activeMap,
        edges: [
          ...activeMap.edges,
          {
            id: `edge_${Date.now()}`,
            fromNodeId,
            toNodeId,
            label: '',
            style: 'solid',
            direction: 'uni',
          },
        ],
      });
    },
    [activeMap, upsertMindMap]
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        height: '100%',
        padding: 14,
        backgroundColor: 'var(--bg-canvas)',
        minWidth: 0,
      }}
    >
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
            onCreateEdge={handleCreateEdge}
          />
          <MindMapNodeEditorPanel
            map={activeMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          Crie um mapa mental na barra lateral.
        </div>
      )}
    </div>
  );
}
export default MindMapView;
