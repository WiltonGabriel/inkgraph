import { useState } from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface SubplotManagerBarProps {
  selectedSubplotId: string | null;
  onSelectSubplot: (id: string | null) => void;
}

const PRESET_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#a855f7'];

export function SubplotManagerBar({ selectedSubplotId, onSelectSubplot }: SubplotManagerBarProps) {
  const { project, upsertSubplot, deleteSubplot } = useProject();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    upsertSubplot({
      id: `subplot_${Date.now()}`,
      name: trimmed,
      color: newColor,
      description: '',
      sceneIds: [],
    });
    setNewName('');
    setNewColor(PRESET_COLORS[(project.subplots.length + 1) % PRESET_COLORS.length]);
  };

  return (
    <div style={barStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
        <span style={titleStyle}>
          <GitBranch size={14} color="var(--accent-primary)" /> Subtramas:
        </span>

        <button
          type="button"
          onClick={() => onSelectSubplot(null)}
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            backgroundColor: selectedSubplotId === null ? 'var(--accent-primary)' : 'var(--bg-elevated)',
            color: selectedSubplotId === null ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          Todas as Cenas
        </button>

        {project.subplots.map((sp) => {
          const isActive = selectedSubplotId === sp.id;
          return (
            <div
              key={sp.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px 3px 10px',
                borderRadius: 999,
                backgroundColor: isActive ? sp.color : 'var(--bg-elevated)',
                border: `1px solid ${sp.color}`,
                color: isActive ? '#ffffff' : 'var(--text-primary)',
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              <span
                onClick={() => onSelectSubplot(isActive ? null : sp.id)}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#ffffff' : sp.color,
                  }}
                />
                {sp.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isActive) onSelectSubplot(null);
                  deleteSubplot(sp.id);
                }}
                title="Remover subtrama"
                style={{
                  background: 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          title="Cor da subtrama"
          style={{
            width: 24,
            height: 24,
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            cursor: 'pointer',
            backgroundColor: 'var(--bg-canvas)',
          }}
        />
        <input
          type="text"
          placeholder="Nova subtrama..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={inputStyle}
        />
        <button type="button" onClick={handleAdd} style={createBtnStyle}>
          <Plus size={13} /> Criar
        </button>
      </div>
    </div>
  );
}

const barStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 10,
  padding: '8px 14px',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--card-shadow)',
};
const titleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-secondary)',
  marginRight: 4,
};
const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-canvas)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 8px',
  fontSize: 12,
  color: 'var(--text-primary)',
  width: 150,
};
const createBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 10px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  fontSize: 11.5,
  fontWeight: 600,
};
