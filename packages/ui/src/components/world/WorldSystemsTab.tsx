import { useState, type CSSProperties } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { World, RuleSystem } from '../../types/project';

interface WorldSystemsTabProps {
  world: World;
  onUpdateWorld: (next: World) => void;
}

export function WorldSystemsTab({ world, onUpdateWorld }: WorldSystemsTabProps) {
  const [name, setName] = useState('');
  const [subtype, setSubtype] = useState('Sistema de Magia');
  const [coreSource, setCoreSource] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [costsAndToll, setCostsAndToll] = useState('');
  const [limitsText, setLimitsText] = useState('');

  const handleAddSystem = () => {
    if (!name.trim()) return;
    const newSys: RuleSystem = {
      id: `sys_${Date.now()}`,
      worldId: world.id,
      name: name.trim(),
      subtype: subtype.trim() || 'Sistema de Regras',
      coreSource: coreSource.trim() || 'Fonte primária não especificada',
      fundamentalRules: rulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      costsAndToll: costsAndToll.trim() || 'Desgaste progressivo',
      hardLimits: limitsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      socialTaboos: '',
      knownPractitionerIds: [],
      notes: '',
    };
    onUpdateWorld({
      ...world,
      systems: [...world.systems, newSys],
    });
    setName('');
    setCoreSource('');
    setRulesText('');
    setCostsAndToll('');
    setLimitsText('');
  };

  const handleUpdateSystem = (sysId: string, patch: Partial<RuleSystem>) => {
    onUpdateWorld({
      ...world,
      systems: world.systems.map((s) => (s.id === sysId ? { ...s, ...patch } : s)),
    });
  };

  const handleDeleteSystem = (sysId: string) => {
    onUpdateWorld({
      ...world,
      systems: world.systems.filter((s) => s.id !== sysId),
    });
  };

  return (
    <div style={{ maxWidth: 920, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {world.systems.map((sys) => (
        <div
          key={sys.id}
          style={{
            padding: 18,
            backgroundColor: '#121621',
            border: '1px solid #242c3e',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <input
              value={sys.name}
              onChange={(e) => handleUpdateSystem(sys.id, { name: e.target.value })}
              style={{ ...inputStyle, fontWeight: 700, fontSize: 15 }}
            />
            <input
              value={sys.subtype}
              onChange={(e) => handleUpdateSystem(sys.id, { subtype: e.target.value })}
              style={{ ...inputStyle, maxWidth: 220 }}
            />
            <button
              onClick={() => handleDeleteSystem(sys.id)}
              title="Excluir sistema"
              style={{
                padding: '6px 10px',
                backgroundColor: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 6,
                color: '#f87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
              }}
            >
              <Trash2 size={13} /> Excluir
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Fonte Primária</label>
              <input
                value={sys.coreSource}
                onChange={(e) => handleUpdateSystem(sys.id, { coreSource: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Custos & Pedágio</label>
              <input
                value={sys.costsAndToll}
                onChange={(e) => handleUpdateSystem(sys.id, { costsAndToll: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Leis Fundamentais (uma por linha)</label>
              <textarea
                rows={3}
                value={sys.fundamentalRules.join('\n')}
                onChange={(e) =>
                  handleUpdateSystem(sys.id, {
                    fundamentalRules: e.target.value.split('\n').filter((r) => r.trim()),
                  })
                }
                style={textareaStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Limites Absolutos (um por linha)</label>
              <textarea
                rows={3}
                value={sys.hardLimits.join('\n')}
                onChange={(e) =>
                  handleUpdateSystem(sys.id, {
                    hardLimits: e.target.value.split('\n').filter((l) => l.trim()),
                  })
                }
                style={textareaStyle}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Create New Rule System Card */}
      <div
        style={{
          padding: 18,
          backgroundColor: '#121621',
          border: '1px solid #242c3e',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f3f4f6' }}>
          + Novo Sistema de Regras (Magia, Tecnologia, Código Legal ou Economia)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do sistema..."
            style={inputStyle}
          />
          <input
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
            placeholder="Subtipo (ex.: Magia, Cyberware, Direito)..."
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            value={coreSource}
            onChange={(e) => setCoreSource(e.target.value)}
            placeholder="Fonte primária / origem..."
            style={inputStyle}
          />
          <input
            value={costsAndToll}
            onChange={(e) => setCostsAndToll(e.target.value)}
            placeholder="Pedágio e custo de uso..."
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <textarea
            rows={2}
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder="Leis fundamentais (uma por linha)..."
            style={textareaStyle}
          />
          <textarea
            rows={2}
            value={limitsText}
            onChange={(e) => setLimitsText(e.target.value)}
            placeholder="Limites intransponíveis (um por linha)..."
            style={textareaStyle}
          />
        </div>
        <button
          onClick={handleAddSystem}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 14px',
            backgroundColor: '#10b981',
            color: '#052e16',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Plus size={14} /> Adicionar Sistema
        </button>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: 4,
};

const inputStyle: CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#f3f4f6',
  fontSize: 13,
};

const textareaStyle: CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '9px 11px',
  color: '#e5e7eb',
  fontSize: 13,
  lineHeight: 1.5,
  resize: 'vertical',
};
