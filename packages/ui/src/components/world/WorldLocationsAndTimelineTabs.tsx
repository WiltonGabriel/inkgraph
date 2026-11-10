import { useState, type CSSProperties } from 'react';
import { Plus } from 'lucide-react';
import type { World, Faction } from '../../types/project';

interface WorldLocationsTabProps {
  world: World;
  factions: Faction[];
  onUpdateWorld: (next: World) => void;
}

export function WorldLocationsTab({ world, factions, onUpdateWorld }: WorldLocationsTabProps) {
  const [selectedLocId, setSelectedLocId] = useState<string>(world.locations[0]?.id ?? '');
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');

  const selectedLoc =
    world.locations.find((l) => l.id === selectedLocId) ?? world.locations[0];

  const handleAddLocation = () => {
    if (!newLocName.trim()) return;
    const loc = {
      id: `loc_${Date.now()}`,
      worldId: world.id,
      name: newLocName.trim(),
      type: 'city' as const,
      population: 'Desconhecida',
      climateOrAtmosphere: 'Temperado',
      description: newLocDesc.trim() || 'Novo local adicionado ao atlas.',
      strategicValue: 'Ponto estratégico regional.',
      coordinates: {
        x: Math.round(20 + Math.random() * 60),
        y: Math.round(20 + Math.random() * 60),
      },
      connectedLocationIds: [],
      notes: '',
    };
    onUpdateWorld({
      ...world,
      locations: [...world.locations, loc],
    });
    setSelectedLocId(loc.id);
    setNewLocName('');
    setNewLocDesc('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
      <div>
        <div
          style={{
            height: 360,
            backgroundColor: '#0a0e17',
            border: '1px solid #22293a',
            borderRadius: 10,
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <svg width="100%" height="100%">
            {world.locations.map((loc) =>
              loc.connectedLocationIds.map((targetId) => {
                const target = world.locations.find((l) => l.id === targetId);
                if (!target || loc.id > target.id) return null;
                return (
                  <line
                    key={`${loc.id}-${target.id}`}
                    x1={`${loc.coordinates.x}%`}
                    y1={`${loc.coordinates.y}%`}
                    x2={`${target.coordinates.x}%`}
                    y2={`${target.coordinates.y}%`}
                    stroke="#374151"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                );
              })
            )}
          </svg>

          {world.locations.map((loc) => {
            const isSel = selectedLoc?.id === loc.id;
            const fac = factions.find((f) => f.id === loc.controlledByFactionId);
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocId(loc.id)}
                style={{
                  position: 'absolute',
                  left: `${loc.coordinates.x}%`,
                  top: `${loc.coordinates.y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: isSel ? '#10b981' : '#161f30',
                  border: `2px solid ${fac?.color ?? '#60a5fa'}`,
                  color: isSel ? '#052e16' : '#f3f4f6',
                  padding: '5px 10px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
                }}
              >
                {loc.name}
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: 14,
            backgroundColor: '#121621',
            border: '1px solid #22293a',
            borderRadius: 8,
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            value={newLocName}
            onChange={(e) => setNewLocName(e.target.value)}
            placeholder="Nome do novo local..."
            style={inputStyle}
          />
          <input
            value={newLocDesc}
            onChange={(e) => setNewLocDesc(e.target.value)}
            placeholder="Descrição rápida..."
            style={inputStyle}
          />
          <button
            onClick={handleAddLocation}
            style={{
              padding: '8px 14px',
              backgroundColor: '#10b981',
              color: '#052e16',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} /> Adicionar Local
          </button>
        </div>
      </div>

      {selectedLoc && (
        <div
          style={{
            padding: 18,
            backgroundColor: '#121621',
            border: '1px solid #22293a',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 17, color: '#f3f4f6' }}>{selectedLoc.name}</h3>
          <div>
            <label style={labelStyle}>População</label>
            <input
              value={selectedLoc.population ?? ''}
              onChange={(e) =>
                onUpdateWorld({
                  ...world,
                  locations: world.locations.map((l) =>
                    l.id === selectedLoc.id ? { ...l, population: e.target.value } : l
                  ),
                })
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Clima & Atmosfera Sensorial</label>
            <textarea
              rows={2}
              value={selectedLoc.climateOrAtmosphere}
              onChange={(e) =>
                onUpdateWorld({
                  ...world,
                  locations: world.locations.map((l) =>
                    l.id === selectedLoc.id ? { ...l, climateOrAtmosphere: e.target.value } : l
                  ),
                })
              }
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Descrição Geográfica & Arquitetônica</label>
            <textarea
              rows={3}
              value={selectedLoc.description}
              onChange={(e) =>
                onUpdateWorld({
                  ...world,
                  locations: world.locations.map((l) =>
                    l.id === selectedLoc.id ? { ...l, description: e.target.value } : l
                  ),
                })
              }
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Valor Estratégico & Facção Controladora</label>
            <textarea
              rows={2}
              value={selectedLoc.strategicValue}
              onChange={(e) =>
                onUpdateWorld({
                  ...world,
                  locations: world.locations.map((l) =>
                    l.id === selectedLoc.id ? { ...l, strategicValue: e.target.value } : l
                  ),
                })
              }
              style={textareaStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function WorldTimelineTab({
  world,
  onUpdateWorld,
}: {
  world: World;
  onUpdateWorld: (next: World) => void;
}) {
  const [newEvtEra, setNewEvtEra] = useState('');
  const [newEvtYear, setNewEvtYear] = useState('');
  const [newEvtTitle, setNewEvtTitle] = useState('');
  const [newEvtDesc, setNewEvtDesc] = useState('');

  const handleAddEvent = () => {
    if (!newEvtTitle.trim()) return;
    onUpdateWorld({
      ...world,
      timeline: [
        ...world.timeline,
        {
          id: `evt_${Date.now()}`,
          worldId: world.id,
          era: newEvtEra.trim() || 'Era Atual',
          year: newEvtYear.trim() || 'Ano ?',
          title: newEvtTitle.trim(),
          description: newEvtDesc.trim(),
          factionIds: [],
          characterIds: [],
          impactLevel: 'high',
        },
      ],
    });
    setNewEvtEra('');
    setNewEvtYear('');
    setNewEvtTitle('');
    setNewEvtDesc('');
  };

  return (
    <div style={{ maxWidth: 920 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {world.timeline.map((evt) => (
          <div
            key={evt.id}
            style={{
              padding: 16,
              backgroundColor: '#121621',
              borderLeft: '4px solid #10b981',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
              {evt.era} · {evt.year}
            </div>
            <h4 style={{ margin: '4px 0', fontSize: 15, color: '#f3f4f6' }}>{evt.title}</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: '#d1d5db', lineHeight: 1.5 }}>
              {evt.description}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 16,
          backgroundColor: '#121621',
          border: '1px solid #242b3d',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>
          + Adicionar Evento Histórico na Linha do Tempo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8 }}>
          <input
            value={newEvtEra}
            onChange={(e) => setNewEvtEra(e.target.value)}
            placeholder="Era (ex.: Primeira Era)"
            style={inputStyle}
          />
          <input
            value={newEvtYear}
            onChange={(e) => setNewEvtYear(e.target.value)}
            placeholder="Ano / Data"
            style={inputStyle}
          />
          <input
            value={newEvtTitle}
            onChange={(e) => setNewEvtTitle(e.target.value)}
            placeholder="Título do marco histórico..."
            style={inputStyle}
          />
        </div>
        <textarea
          rows={2}
          value={newEvtDesc}
          onChange={(e) => setNewEvtDesc(e.target.value)}
          placeholder="Descrição e consequências geopolíticas do evento..."
          style={textareaStyle}
        />
        <button
          onClick={handleAddEvent}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 14px',
            backgroundColor: '#10b981',
            color: '#052e16',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Registrar Evento
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
