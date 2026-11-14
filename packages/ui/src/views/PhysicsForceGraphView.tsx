import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  ALL_GRAPH_ENTITY_KINDS,
  buildFilteredGraphData,
  type GraphEntityKind,
  type GraphNode,
} from '../components/graph/graphDataBuilder';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { GraphCanvas2D } from '../components/graph/GraphCanvas2D';
import { GraphTableView } from '../components/graph/GraphTableView';
import { GraphNodeInspector } from '../components/graph/GraphNodeInspector';

export function PhysicsForceGraphView() {
  const { project, setActiveView, setActiveSubPath } = useProject();
  const [enabledKinds, setEnabledKinds] = useState<GraphEntityKind[]>(() => [
    ...ALL_GRAPH_ENTITY_KINDS,
  ]);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [repulsionStrength, setRepulsionStrength] = useState<number>(450);
  const [pinnedCount, setPinnedCount] = useState<number>(0);
  const [releaseSignal, setReleaseSignal] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  const handleToggleKind = useCallback((kind: GraphEntityKind) => {
    setEnabledKinds((prev) => {
      if (prev.includes(kind)) {
        // Keep at least 1 layer enabled so the canvas isn't accidentally emptied
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== kind);
      }
      return [...prev, kind];
    });
  }, []);

  const handleSelectAllKinds = useCallback(() => {
    setEnabledKinds([...ALL_GRAPH_ENTITY_KINDS]);
  }, []);

  const { nodes, links, allEntities } = useMemo(
    () => buildFilteredGraphData(project, enabledKinds),
    [project, enabledKinds]
  );

  const activeNodeId = useMemo(
    () => (allEntities.some((e) => e.id === selectedNodeId) ? selectedNodeId : ''),
    [allEntities, selectedNodeId]
  );

  const handleOpenDossier = useCallback(
    (node: GraphNode) => {
      setSelectedNodeId(node.id);
      if (node.kind === 'character') setActiveView('characters');
      else if (node.kind === 'faction') setActiveView('factions');
      else if (node.kind === 'location') {
        setActiveView('worlds');
        setActiveSubPath('Locais');
      } else if (node.kind === 'system') {
        setActiveView('worlds');
        setActiveSubPath('Sistemas & Leis');
      } else if (node.kind === 'object') setActiveView('objects');
    },
    [setActiveView, setActiveSubPath]
  );

  const handleReleasePinnedNodes = useCallback(() => setReleaseSignal((p) => p + 1), []);

  return (
    <div style={rootStyle}>
      <div
        style={{
          ...mainPaneStyle,
          borderRight: activeNodeId ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <GraphToolbar
          enabledKinds={enabledKinds}
          onToggleKind={handleToggleKind}
          onSelectAllKinds={handleSelectAllKinds}
          viewMode={viewMode}
          setViewMode={setViewMode}
          nodeCount={nodes.length}
          linkCount={links.length}
          repulsionStrength={repulsionStrength}
          setRepulsionStrength={setRepulsionStrength}
          pinnedCount={pinnedCount}
          onReleasePinnedNodes={handleReleasePinnedNodes}
        />
        {viewMode === 'graph' ? (
          <GraphCanvas2D
            nodes={nodes}
            links={links}
            selectedNodeId={activeNodeId}
            onSelectNode={setSelectedNodeId}
            onOpenDossier={handleOpenDossier}
            repulsionStrength={repulsionStrength}
            onPinnedCountChange={setPinnedCount}
            releaseSignal={releaseSignal}
          />
        ) : (
          <GraphTableView links={links} allEntities={allEntities} onSelectNode={setSelectedNodeId} />
        )}
      </div>
      {activeNodeId && (
        <GraphNodeInspector
          selectedNodeId={activeNodeId}
          setSelectedNodeId={setSelectedNodeId}
          allEntities={allEntities}
          onOpenDossier={handleOpenDossier}
          onClose={() => setSelectedNodeId('')}
        />
      )}
    </div>
  );
}

const rootStyle: CSSProperties = {
  display: 'flex',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  backgroundColor: 'var(--bg-canvas)',
  color: 'var(--text-primary)',
};
const mainPaneStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
};
