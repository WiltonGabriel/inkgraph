import { useState } from 'react';
import { Network, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { MindMap } from '../../types/project';

interface MindMapListSidebarProps {
  selectedMapId: string;
  onSelectMap: (id: string) => void;
}

export function MindMapListSidebar({ selectedMapId, onSelectMap }: MindMapListSidebarProps) {
  const { project, upsertMindMap, deleteMindMap } = useProject();
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const title = newName.trim() || `Mapa Mental ${project.mindMaps.length + 1}`;
    const newMap: MindMap = {
      id: `mmap_${Date.now()}`,
      name: title,
      description: 'Mapeamento conceitual livre e vínculos canônicos.',
      nodes: [
        {
          id: `node_${Date.now()}`,
          label: title,
          type: 'free',
          shape: 'circle',
          color: '#6366f1',
          x: 340,
          y: 220,
          notes: 'Nó central do mapa.',
        },
      ],
      edges: [],
    };
    upsertMindMap(newMap);
    onSelectMap(newMap.id);
    setNewName('');
  };

  return (
    <div
      style={{
        width: 260,
        backgroundColor: '#111622',
        border: '1px solid #242f44',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid #242f44', backgroundColor: '#182030' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
          <Network size={15} color="#6366f1" /> Mapas Mentais
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            placeholder="Novo mapa..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{
              flex: 1,
              backgroundColor: '#0a0d14',
              border: '1px solid #242f44',
              borderRadius: 6,
              padding: '5px 8px',
              fontSize: 12,
              color: '#f1f5f9',
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: '5px 9px',
              borderRadius: 6,
              backgroundColor: '#6366f1',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Criar Mapa Mental"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {project.mindMaps.map((m) => {
          const active = m.id === selectedMapId;
          return (
            <div
              key={m.id}
              onClick={() => onSelectMap(m.id)}
              style={{
                padding: '9px 10px',
                borderRadius: 6,
                backgroundColor: active ? '#182030' : 'transparent',
                border: `1px solid ${active ? '#6366f1' : 'transparent'}`,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? '#fff' : '#cbd5e1' }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {m.nodes.length} nós • {m.edges.length} conexões
                </div>
              </div>
              {project.mindMaps.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMindMap(m.id);
                  }}
                  title="Excluir mapa"
                  style={{ background: 'transparent', color: '#94a3b8', padding: 4 }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
