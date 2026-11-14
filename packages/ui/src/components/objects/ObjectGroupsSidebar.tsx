import { useState } from 'react';
import { FolderKanban, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface ObjectGroupsSidebarProps {
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
}

export function ObjectGroupsSidebar({
  selectedGroupId,
  onSelectGroup,
}: ObjectGroupsSidebarProps) {
  const { project, upsertObjectGroup, deleteObjectGroup } = useProject();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const handleAddGroup = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    upsertObjectGroup({
      id: `ogrp_${Date.now()}`,
      name: trimmed,
      color: newColor,
      description: '',
    });
    setNewName('');
  };

  return (
    <div
      style={{
        width: 245,
        backgroundColor: 'var(--bg-surface, #111623)',
        border: '1px solid var(--border-subtle, #263046)',
        borderRadius: 'var(--radius-md, 8px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle, #263046)', backgroundColor: 'var(--bg-elevated, #171d2e)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', marginBottom: 8 }}>
          <FolderKanban size={15} style={{ color: 'var(--accent-primary, #3b82f6)' }} /> Grupos de Objetos
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{ width: 26, height: 28, border: 'none', cursor: 'pointer', background: 'transparent' }}
          />
          <input
            placeholder="Novo grupo..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-canvas, #0b0e16)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 5,
              padding: '4px 8px',
              fontSize: 11.5,
              color: 'var(--text-primary, #f1f5f9)',
            }}
          />
          <button
            onClick={handleAddGroup}
            style={{
              padding: '4px 8px',
              borderRadius: 5,
              backgroundColor: 'var(--accent-primary, #3b82f6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <button
          onClick={() => onSelectGroup(null)}
          style={{
            textAlign: 'left',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: selectedGroupId === null ? 'var(--bg-hover, #1f273d)' : 'transparent',
            border: `1px solid ${selectedGroupId === null ? 'var(--accent-primary, #3b82f6)' : 'transparent'}`,
            color: selectedGroupId === null ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Todos os Objetos ({project.objects.length})
        </button>

        {project.objectGroups.map((g) => {
          const active = selectedGroupId === g.id;
          const count = project.objects.filter((o) => o.groupId === g.id).length;
          return (
            <div
              key={g.id}
              onClick={() => onSelectGroup(active ? null : g.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: active ? 'var(--bg-hover, #1f273d)' : 'transparent',
                border: `1px solid ${active ? g.color : 'transparent'}`,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: active ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: g.color }} />
                {g.name} ({count})
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (active) onSelectGroup(null);
                  deleteObjectGroup(g.id);
                }}
                style={{ background: 'transparent', color: 'var(--text-muted, #64748b)', padding: 2 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
