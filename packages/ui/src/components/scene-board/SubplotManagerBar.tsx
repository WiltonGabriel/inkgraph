import { useState } from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface SubplotManagerBarProps {
  selectedSubplotId: string | null;
  onSelectSubplot: (id: string | null) => void;
}

const PRESET_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#a855f7'];

export function SubplotManagerBar({
  selectedSubplotId,
  onSelectSubplot,
}: SubplotManagerBarProps) {
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        padding: '8px 14px',
        backgroundColor: '#111622',
        border: '1px solid #242f44',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            color: '#94a3b8',
            marginRight: 4,
          }}
        >
          <GitBranch size={14} color="#6366f1" /> Subtramas:
        </span>

        <button
          onClick={() => onSelectSubplot(null)}
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            backgroundColor: selectedSubplotId === null ? '#6366f1' : '#182030',
            color: selectedSubplotId === null ? '#ffffff' : '#cbd5e1',
            border: '1px solid #2c3852',
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
                backgroundColor: isActive ? sp.color : '#182030',
                border: `1px solid ${sp.color}`,
                color: isActive ? '#ffffff' : '#e2e8f0',
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
                onClick={() => {
                  if (isActive) onSelectSubplot(null);
                  deleteSubplot(sp.id);
                }}
                title="Remover subtrama"
                style={{
                  background: 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
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
          style={{ width: 24, height: 24, border: 'none', cursor: 'pointer' }}
        />
        <input
          type="text"
          placeholder="Nova subtrama..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            backgroundColor: '#0a0d14',
            border: '1px solid #242f44',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            color: '#f1f5f9',
            width: 150,
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 6,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#e2e8f0',
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          <Plus size={13} /> Criar
        </button>
      </div>
    </div>
  );
}
