import { useState } from 'react';
import { Link, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { MindMap, MindMapNode, MindMapNodeShape } from '../../types/project';

interface MindMapNodeEditorPanelProps {
  map: MindMap;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

export function MindMapNodeEditorPanel({ map, selectedNodeId, onSelectNode }: MindMapNodeEditorPanelProps) {
  const { project, upsertMindMap } = useProject();
  const selectedNode = map.nodes.find((n) => n.id === selectedNodeId) ?? map.nodes[0] ?? null;

  const [edgeToId, setEdgeToId] = useState('');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dotted'>('solid');
  const [edgeDir, setEdgeDir] = useState<'uni' | 'bi'>('uni');

  const updateNode = (patch: Partial<MindMapNode>) => {
    if (!selectedNode) return;
    upsertMindMap({ ...map, nodes: map.nodes.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)) });
  };

  const handleAddNode = () => {
    const idx = map.nodes.length;
    const newNode: MindMapNode = {
      id: `node_${Date.now()}`,
      label: `Novo Nó ${idx + 1}`,
      type: 'free',
      shape: 'rectangle',
      color: '#3b82f6',
      x: 160 + (idx % 4) * 180,
      y: 120 + Math.floor(idx / 4) * 130,
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
      edges: map.edges.filter((e) => e.fromNodeId !== selectedNode.id && e.toNodeId !== selectedNode.id),
    });
    onSelectNode(remaining[0]?.id ?? '');
  };

  const handleAddEdge = () => {
    if (!selectedNode || !edgeToId || edgeToId === selectedNode.id) return;
    upsertMindMap({
      ...map,
      edges: [
        ...map.edges,
        { id: `edge_${Date.now()}`, fromNodeId: selectedNode.id, toNodeId: edgeToId, label: edgeLabel.trim(), style: edgeStyle, direction: edgeDir },
      ],
    });
    setEdgeLabel('');
  };

  const handleDeleteEdge = (edgeId: string) => {
    upsertMindMap({ ...map, edges: map.edges.filter((e) => e.id !== edgeId) });
  };

  const connectedEdges = selectedNode
    ? map.edges.filter((e) => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id)
    : [];

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Inspetor de Nó</span>
        <button type="button" onClick={handleAddNode} style={addBtnStyle}>
          <Plus size={13} /> Novo Nó
        </button>
      </div>

      {selectedNode ? (
        <>
          <div>
            <label style={lbl}>Rótulo</label>
            <input value={selectedNode.label} onChange={(e) => updateNode({ label: e.target.value })} style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px', gap: 8 }}>
            <div>
              <label style={lbl}>Formato</label>
              <select value={selectedNode.shape} onChange={(e) => updateNode({ shape: e.target.value as MindMapNodeShape })} style={inp}>
                <option value="circle">Círculo</option>
                <option value="rectangle">Retângulo</option>
                <option value="ellipse">Pílula / Elipse</option>
                <option value="diamond">Diamante</option>
                <option value="hexagon">Hexágono</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Cor</label>
              <input
                type="color"
                value={selectedNode.color}
                onChange={(e) => updateNode({ color: e.target.value })}
                style={{ width: '100%', height: 30, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'var(--bg-canvas)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Tipo de Nó</label>
              <select value={selectedNode.type} onChange={(e) => updateNode({ type: e.target.value as 'free' | 'linked' })} style={inp}>
                <option value="free">Livre</option>
                <option value="linked">Vinculado</option>
              </select>
            </div>
            {selectedNode.type === 'linked' && (
              <div>
                <label style={lbl}>Categoria</label>
                <select
                  value={selectedNode.linkedEntityKind ?? 'character'}
                  onChange={(e) => updateNode({ linkedEntityKind: e.target.value as MindMapNode['linkedEntityKind'] })}
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
            <textarea rows={2} value={selectedNode.notes} onChange={(e) => updateNode({ notes: e.target.value })} style={inp} />
          </div>

          <button type="button" onClick={handleDeleteNode} style={delBtnStyle}>
            <Trash2 size={12} /> Remover Nó
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Link size={13} color="var(--accent-primary)" /> Conectar Aresta
          </div>

          <select value={edgeToId} onChange={(e) => setEdgeToId(e.target.value)} style={inp}>
            <option value="">Selecionar nó destino...</option>
            {map.nodes
              .filter((n) => n.id !== selectedNode.id)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
          </select>

          <input placeholder="Rótulo da conexão..." value={edgeLabel} onChange={(e) => setEdgeLabel(e.target.value)} style={inp} />

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

          <button type="button" onClick={handleAddEdge} style={connectBtnStyle}>
            Adicionar Conexão
          </button>

          {connectedEdges.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                Conexões do nó ({connectedEdges.length})
              </span>
              {connectedEdges.map((edge) => {
                const otherId = edge.fromNodeId === selectedNode.id ? edge.toNodeId : edge.fromNodeId;
                const otherNode = map.nodes.find((n) => n.id === otherId);
                const dirSymbol = edge.direction === 'bi' ? '↔' : edge.fromNodeId === selectedNode.id ? '→' : '←';
                return (
                  <div key={edge.id} style={edgeItemStyle}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dirSymbol} {otherNode?.label ?? otherId}
                      {edge.label ? ` (${edge.label})` : ''}
                    </span>
                    <button type="button" onClick={() => handleDeleteEdge(edge.id)} title="Remover conexão" style={{ background: 'transparent', color: 'var(--danger)', padding: 2, flexShrink: 0 }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selecione ou crie um nó.</div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = { width: 310, minWidth: 270, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'var(--card-shadow)' };
const addBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-primary)', color: '#ffffff', fontSize: 11.5, fontWeight: 600 };
const delBtnStyle: React.CSSProperties = { padding: '5px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger)', fontSize: 11.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 };
const connectBtnStyle: React.CSSProperties = { padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600 };
const edgeItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '4px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-secondary)' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 3 };
const inp: React.CSSProperties = { width: '100%', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: 11.5, color: 'var(--text-primary)' };
