import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import { useProject } from '../context/ProjectContext';
import { buildFilteredGraphData, type GraphNode, type ScopeFilter } from '../components/graph/graphDataBuilder';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { GraphCanvas2D } from '../components/graph/GraphCanvas2D';
import { GraphTableView } from '../components/graph/GraphTableView';
import { GraphNodeInspector } from '../components/graph/GraphNodeInspector';

export function PhysicsForceGraphView() {
  const { project, setActiveView, setActiveSubPath } = useProject();
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [repulsionStrength, setRepulsionStrength] = useState<number>(450);
  const [pinnedCount, setPinnedCount] = useState<number>(0);
  const [releaseSignal, setReleaseSignal] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  const { nodes, links, allEntities } = useMemo(() => buildFilteredGraphData(project, scope), [project, scope]);
  const activeNodeId = useMemo(
    () => (allEntities.some((e) => e.id === selectedNodeId) ? selectedNodeId : (allEntities[0]?.id ?? '')),
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
      <div style={mainPaneStyle}>
        <GraphToolbar
          scope={scope}
          setScope={setScope}
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
      <GraphNodeInspector selectedNodeId={activeNodeId} setSelectedNodeId={setSelectedNodeId} allEntities={allEntities} onOpenDossier={handleOpenDossier} />
    </div>
  );
}

const rootStyle: CSSProperties = { display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' };
const mainPaneStyle: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', minWidth: 0, minHeight: 0 };
