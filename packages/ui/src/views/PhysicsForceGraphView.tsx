import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  buildFilteredGraphData,
  getGraphLayersForProject,
  type GraphEntityKind,
  type GraphNode,
} from '../components/graph/graphDataBuilder';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { GraphCanvas2D } from '../components/graph/GraphCanvas2D';
import { GraphTableView } from '../components/graph/GraphTableView';
import { GraphNodeInspector } from '../components/graph/GraphNodeInspector';

export function PhysicsForceGraphView() {
  const { project, setActiveView, setActiveSubPath, setActiveCustomEntityTypeId } = useProject();
  const [disabledKinds, setDisabledKinds] = useState<GraphEntityKind[]>([]);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [repulsionStrength, setRepulsionStrength] = useState<number>(450);
  const [pinnedCount, setPinnedCount] = useState<number>(0);
  const [releaseSignal, setReleaseSignal] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  const graphLayers = useMemo(() => getGraphLayersForProject(project), [project]);
  const enabledKinds = useMemo(
    () => graphLayers.map((l) => l.kind).filter((k) => !disabledKinds.includes(k)),
    [graphLayers, disabledKinds]
  );

  const handleToggleKind = useCallback(
    (kind: GraphEntityKind) => {
      setDisabledKinds((prev) => {
        if (prev.includes(kind)) {
          return prev.filter((item) => item !== kind);
        }
        // Keep at least 1 layer enabled so the canvas isn't accidentally emptied
        const remaining = graphLayers.filter(
          (l) => l.kind !== kind && !prev.includes(l.kind)
        );
        if (remaining.length === 0) return prev;
        return [...prev, kind];
      });
    },
    [graphLayers]
  );

  const handleSelectAllKinds = useCallback(() => {
    setDisabledKinds([]);
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
      else {
        setActiveCustomEntityTypeId(node.kind);
        setActiveView('custom-entity');
      }
    },
    [setActiveView, setActiveSubPath, setActiveCustomEntityTypeId]
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
          layers={graphLayers}
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
