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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
        minWidth: 220,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          <Network size={15} color="var(--accent-primary)" /> Mapas Mentais
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
              minWidth: 0,
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 8px',
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={handleCreate}
            style={{
              padding: '5px 9px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Criar Mapa Mental"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {project.mindMaps.map((m) => {
          const active = m.id === selectedMapId;
          const hovered = hoveredId === m.id;
          return (
            <div
              key={m.id}
              onClick={() => onSelectMap(m.id)}
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId((prev) => (prev === m.id ? null : prev))}
              style={{
                padding: '9px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: active
                  ? 'var(--bg-elevated)'
                  : hovered
                  ? 'var(--bg-hover)'
                  : 'transparent',
                border: `1px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {m.nodes.length} {m.nodes.length === 1 ? 'nó' : 'nós'} • {m.edges.length}{' '}
                  {m.edges.length === 1 ? 'conexão' : 'conexões'}
                </div>
              </div>
              {project.mindMaps.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMindMap(m.id);
                  }}
                  title="Excluir mapa"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    padding: 4,
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
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
