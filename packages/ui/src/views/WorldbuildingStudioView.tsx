import { useState } from 'react';
import {
  Globe,
  MapPin,
  Cpu,
  Clock,
  Plus,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { calculateWorldCompleteness } from '../types/project';
import { CompletenessRing } from '../components/ui/CompletenessRing';

export function WorldbuildingStudioView() {
  const { project, upsertWorld } = useProject();
  const world = project.worlds[0];

  const [tab, setTab] = useState<'overview' | 'locations' | 'systems' | 'timeline'>('overview');
  const [selectedLocId, setSelectedLocId] = useState<string>(
    world?.locations[0]?.id ?? ''
  );

  // Add Location Form
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');

  // Add Timeline Event Form
  const [newEvtEra, setNewEvtEra] = useState('');
  const [newEvtYear, setNewEvtYear] = useState('');
  const [newEvtTitle, setNewEvtTitle] = useState('');
  const [newEvtDesc, setNewEvtDesc] = useState('');

  if (!world) return null;

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
    upsertWorld({
      ...world,
      locations: [...world.locations, loc],
    });
    setSelectedLocId(loc.id);
    setNewLocName('');
    setNewLocDesc('');
  };

  const handleAddEvent = () => {
    if (!newEvtTitle.trim()) return;
    upsertWorld({
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 46px)', overflow: 'hidden' }}>
      {/* Top Atlas Header */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#10141d',
          borderBottom: '1px solid #1b202c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <CompletenessRing percent={calculateWorldCompleteness(world)} size={48} strokeWidth={4} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: '#f9fafb' }}>
              Atlas do Mundo: {world.name}
            </h2>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {world.locations.length} locais mapeados · {world.systems.length} sistemas de regras · {world.timeline.length} marcos históricos
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '0 24px',
          backgroundColor: '#10141d',
          borderBottom: '1px solid #1b202c',
        }}
      >
        {[
          { id: 'overview', label: 'Visão Geral, Geografia & Cultura', icon: Globe },
          { id: 'locations', label: `Locais & Mapa Tático (${world.locations.length})`, icon: MapPin },
          { id: 'systems', label: `Sistemas & Leis (${world.systems.length})`, icon: Cpu },
          { id: 'timeline', label: `História & Linha do Tempo (${world.timeline.length})`, icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 14px',
                border: 'none',
                borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
                background: 'transparent',
                color: active ? '#34d399' : '#9ca3af',
                fontSize: 12.5,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'overview' && (
          <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Nome do Mundo</label>
                <input
                  value={world.name}
                  onChange={(e) => upsertWorld({ ...world, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Premissa Central</label>
                <input
                  value={world.premise}
                  onChange={(e) => upsertWorld({ ...world, premise: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Descrição Principal</label>
              <textarea
                rows={3}
                value={world.description}
                onChange={(e) => upsertWorld({ ...world, description: e.target.value })}
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Geografia, Clima & Regiões</label>
                <textarea
                  rows={4}
                  value={world.geography}
                  onChange={(e) => upsertWorld({ ...world, geography: e.target.value })}
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Cultura, Sociedade & Costumes</label>
                <textarea
                  rows={4}
                  value={world.culture}
                  onChange={(e) => upsertWorld({ ...world, culture: e.target.value })}
                  style={textareaStyle}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Sistema de Magia / Tecnologia (Resumo)</label>
                <textarea
                  rows={3}
                  value={world.magicOrTechSummary}
                  onChange={(e) =>
                    upsertWorld({ ...world, magicOrTechSummary: e.target.value })
                  }
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Geopolítica & Tensão entre Facções</label>
                <textarea
                  rows={3}
                  value={world.politicsSummary}
                  onChange={(e) =>
                    upsertWorld({ ...world, politicsSummary: e.target.value })
                  }
                  style={textareaStyle}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'locations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            {/* Interactive 2D Tactical Map */}
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
                  {/* Routes between connected locations */}
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
                  const fac = project.factions.find(
                    (f) => f.id === loc.controlledByFactionId
                  );
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

              {/* Add Location Box */}
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

            {/* Selected Location Inspector */}
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
                <h3 style={{ margin: 0, fontSize: 17, color: '#f3f4f6' }}>
                  {selectedLoc.name}
                </h3>
                <div>
                  <label style={labelStyle}>População</label>
                  <input
                    value={selectedLoc.population ?? ''}
                    onChange={(e) =>
                      upsertWorld({
                        ...world,
                        locations: world.locations.map((l) =>
                          l.id === selectedLoc.id
                            ? { ...l, population: e.target.value }
                            : l
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
                      upsertWorld({
                        ...world,
                        locations: world.locations.map((l) =>
                          l.id === selectedLoc.id
                            ? { ...l, climateOrAtmosphere: e.target.value }
                            : l
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
                      upsertWorld({
                        ...world,
                        locations: world.locations.map((l) =>
                          l.id === selectedLoc.id
                            ? { ...l, description: e.target.value }
                            : l
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
                      upsertWorld({
                        ...world,
                        locations: world.locations.map((l) =>
                          l.id === selectedLoc.id
                            ? { ...l, strategicValue: e.target.value }
                            : l
                        ),
                      })
                    }
                    style={textareaStyle}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'systems' && (
          <div style={{ maxWidth: 920, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {world.systems.map((sys) => (
              <div
                key={sys.id}
                style={{
                  padding: 20,
                  backgroundColor: '#121621',
                  border: '1px solid #242c3e',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 17, color: '#f3f4f6' }}>{sys.name}</h3>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      backgroundColor: 'rgba(168,85,247,0.15)',
                      color: '#c084fc',
                      borderRadius: 999,
                      fontWeight: 600,
                    }}
                  >
                    {sys.subtype}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#d1d5db', margin: '0 0 12px' }}>
                  <strong>Fonte Primária:</strong> {sys.coreSource}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ padding: 12, backgroundColor: '#0c0f17', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>
                      Leis Fundamentais
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>
                      {sys.fundamentalRules.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ padding: 12, backgroundColor: '#0c0f17', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>
                      Limites Absolutos & Custos
                    </div>
                    <div style={{ fontSize: 12, color: '#fca5a5', marginBottom: 6 }}>
                      <strong>Pedágio:</strong> {sys.costsAndToll}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>
                      {sys.hardLimits.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'timeline' && (
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
                  <h4 style={{ margin: '4px 0', fontSize: 15, color: '#f3f4f6' }}>
                    {evt.title}
                  </h4>
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
                  placeholder="Era (ex.: Era da Forja)"
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
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#f3f4f6',
  fontSize: 13,
};

const textareaStyle: React.CSSProperties = {
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
