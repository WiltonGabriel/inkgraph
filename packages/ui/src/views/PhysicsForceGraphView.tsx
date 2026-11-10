import { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  buildFilteredGraphData,
  type ScopeFilter,
} from '../components/graph/graphDataBuilder';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { GraphCanvas2D } from '../components/graph/GraphCanvas2D';
import { GraphTableView } from '../components/graph/GraphTableView';
import { GraphNodeInspector } from '../components/graph/GraphNodeInspector';

export function PhysicsForceGraphView() {
  const { project } = useProject();

  const [scope, setScope] = useState<ScopeFilter>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    project.characters[0]?.id ?? 'char_elias_vance'
  );

  const { nodes, links, allEntities } = useMemo(
    () => buildFilteredGraphData(project, scope),
    [project, scope]
  );

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 46px)',
        overflow: 'hidden',
        backgroundColor: '#090b10',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1b202c',
          minWidth: 0,
        }}
      >
        <GraphToolbar
          scope={scope}
          setScope={setScope}
          viewMode={viewMode}
          setViewMode={setViewMode}
          nodeCount={nodes.length}
          linkCount={links.length}
        />

        {viewMode === 'graph' ? (
          <GraphCanvas2D
            nodes={nodes}
            links={links}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        ) : (
          <GraphTableView links={links} allEntities={allEntities} />
        )}
      </div>

      <GraphNodeInspector
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        allEntities={allEntities}
      />
    </div>
  );
}
