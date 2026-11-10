import { useState } from 'react';
import { Link, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { MindMap, MindMapNode, MindMapNodeShape } from '../../types/project';

interface MindMapNodeEditorPanelProps {
  map: MindMap;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

export function MindMapNodeEditorPanel({
  map,
  selectedNodeId,
  onSelectNode,
}: MindMapNodeEditorPanelProps) {
  const { project, upsertMindMap } = useProject();
  const selectedNode = map.nodes.find((n) => n.id === selectedNodeId) ?? map.nodes[0] ?? null;

  const [edgeToId, setEdgeToId] = useState('');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dotted'>('solid');
  const [edgeDir, setEdgeDir] = useState<'uni' | 'bi'>('uni');

  const updateNode = (patch: Partial<MindMapNode>) => {
    if (!selectedNode) return;
    upsertMindMap({
      ...map,
      nodes: map.nodes.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)),
    });
  };

  const handleAddNode = () => {
    const idx = map.nodes.length;
    const newNode: MindMapNode = {
      id: `node_${Date.now()}`,
      label: `Novo Nó ${idx + 1}`,
      type: 'free',
      shape: 'rectangle',
      color: '#3b82f6',
      x: 160 + (idx % 4) * 160,
      y: 120 + Math.floor(idx / 4) * 120,
      notes: '',
    };
    upsertMindMap({ ...map, nodes: [...map.nodes, newNode] });
    onSelectNode(newNode.id);
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    const remaining = map.nodes.filter((n) => n.id !== selectedNode.id);
    upsertMindMap({
      ...map,
      nodes: remaining,
      edges: map.edges.filter(
        (e) => e.fromNodeId !== selectedNode.id && e.toNodeId !== selectedNode.id
      ),
    });
    onSelectNode(remaining[0]?.id ?? '');
  };

  const handleAddEdge = () => {
    if (!selectedNode || !edgeToId || edgeToId === selectedNode.id) return;
    upsertMindMap({
      ...map,
      edges: [
        ...map.edges,
        {
          id: `edge_${Date.now()}`,
          fromNodeId: selectedNode.id,
          toNodeId: edgeToId,
          label: edgeLabel.trim(),
          style: edgeStyle,
          direction: edgeDir,
        },
      ],
    });
    setEdgeLabel('');
  };

  return (
    <div
      style={{
        width: 310,
        backgroundColor: '#111622',
        border: '1px solid #242f44',
        borderRadius: 8,
        padding: 12,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Inspetor de Nó</span>
        <button
          onClick={handleAddNode}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 9px',
            borderRadius: 6,
            backgroundColor: '#6366f1',
            color: '#fff',
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          <Plus size={13} /> Novo Nó
        </button>
      </div>

      {selectedNode ? (
        <>
          <div>
            <label style={lbl}>Rótulo</label>
            <input
              value={selectedNode.label}
              onChange={(e) => updateNode({ label: e.target.value })}
              style={inp}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px', gap: 8 }}>
            <div>
              <label style={lbl}>Formato</label>
              <select
                value={selectedNode.shape}
                onChange={(e) => updateNode({ shape: e.target.value as MindMapNodeShape })}
                style={inp}
              >
                <option value="circle">Círculo</option>
                <option value="rectangle">Retângulo</option>
                <option value="diamond">Diamante</option>
                <option value="ellipse">Elipse</option>
                <option value="hexagon">Hexágono</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Cor</label>
              <input
                type="color"
                value={selectedNode.color}
                onChange={(e) => updateNode({ color: e.target.value })}
                style={{ width: '100%', height: 30, border: 'none', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Tipo de Nó</label>
              <select
                value={selectedNode.type}
                onChange={(e) => updateNode({ type: e.target.value as 'free' | 'linked' })}
                style={inp}
              >
                <option value="free">Livre</option>
                <option value="linked">Vinculado</option>
              </select>
            </div>
            {selectedNode.type === 'linked' && (
              <div>
                <label style={lbl}>Categoria</label>
                <select
                  value={selectedNode.linkedEntityKind ?? 'character'}
                  onChange={(e) =>
                    updateNode({
                      linkedEntityKind: e.target.value as MindMapNode['linkedEntityKind'],
                    })
                  }
                  style={inp}
                >
                  <option value="character">Personagem</option>
                  <option value="faction">Facção</option>
                  <option value="location">Local</option>
                  <option value="object">Objeto</option>
                  <option value="scene">Cena</option>
                </select>
              </div>
            )}
          </div>

          {selectedNode.type === 'linked' && (
            <div>
              <label style={lbl}>ID / Entidade Vinculada</label>
              <input
                value={selectedNode.linkedEntityId ?? ''}
                onChange={(e) => updateNode({ linkedEntityId: e.target.value })}
                placeholder={project.characters[0]?.id ?? 'char_...'}
                style={inp}
              />
            </div>
          )}

          <div>
            <label style={lbl}>Notas</label>
            <textarea
              rows={2}
              value={selectedNode.notes}
              onChange={(e) => updateNode({ notes: e.target.value })}
              style={inp}
            />
          </div>

          <button
            onClick={handleDeleteNode}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#f87171',
              fontSize: 11.5,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Trash2 size={12} /> Remover Nó
          </button>

          <hr style={{ borderColor: '#242f44' }} />

          <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Link size={13} color="#6366f1" /> Conectar Aresta
          </div>

          <select value={edgeToId} onChange={(e) => setEdgeToId(e.target.value)} style={inp}>
            <option value="">Selecionar nó destino...</option>
            {map.nodes
              .filter((n) => n.id !== selectedNode.id)
              .map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
          </select>

          <input
            placeholder="Rótulo da conexão..."
            value={edgeLabel}
            onChange={(e) => setEdgeLabel(e.target.value)}
            style={inp}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <select value={edgeStyle} onChange={(e) => setEdgeStyle(e.target.value as 'solid' | 'dotted')} style={inp}>
              <option value="solid">Sólida</option>
              <option value="dotted">Pontilhada</option>
            </select>
            <select value={edgeDir} onChange={(e) => setEdgeDir(e.target.value as 'uni' | 'bi')} style={inp}>
              <option value="uni">Unidirecional</option>
              <option value="bi">Bidirecional</option>
            </select>
          </div>

          <button
            onClick={handleAddEdge}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            Adicionar Conexão
          </button>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Selecione ou crie um nó.</div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  color: '#94a3b8',
  marginBottom: 3,
};

const inp: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0a0d14',
  border: '1px solid #242f44',
  borderRadius: 5,
  padding: '5px 8px',
  fontSize: 11.5,
  color: '#f1f5f9',
};
