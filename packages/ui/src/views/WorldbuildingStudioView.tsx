import { useState, type CSSProperties } from 'react';
import { Globe, MapPin, Cpu, Clock, Plus } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { calculateWorldCompleteness, type World } from '../types/project';
import { CompletenessRing } from '../components/ui/CompletenessRing';
import { WorldSystemsTab } from '../components/world/WorldSystemsTab';
import {
  WorldLocationsTab,
  WorldTimelineTab,
} from '../components/world/WorldLocationsAndTimelineTabs';

export function WorldbuildingStudioView() {
  const { project, upsertWorld } = useProject();
  const [selectedWorldId, setSelectedWorldId] = useState<string>(
    project.worlds[0]?.id ?? ''
  );
  const [tab, setTab] = useState<'overview' | 'locations' | 'systems' | 'timeline'>('overview');

  const world =
    project.worlds.find((w) => w.id === selectedWorldId) ?? project.worlds[0];

  const handleCreateWorld = () => {
    const newWorld: World = {
      id: `world_${Date.now()}`,
      name: `Novo Mundo ${project.worlds.length + 1}`,
      premise: '',
      description: '',
      geography: '',
      culture: '',
      history: '',
      magicOrTechSummary: '',
      politicsSummary: '',
      notes: '',
      locations: [],
      timeline: [],
      systems: [],
    };
    upsertWorld(newWorld);
    setSelectedWorldId(newWorld.id);
  };

  if (!world) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 46px)',
          gap: 12,
          color: '#9ca3af',
        }}
      >
        <div>Nenhum mundo cadastrado neste projeto.</div>
        <button
          onClick={handleCreateWorld}
          style={{
            padding: '8px 14px',
            backgroundColor: '#10b981',
            color: '#052e16',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          + Criar Mundo
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 46px)', overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#10141d',
          borderBottom: '1px solid #1b202c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {project.worlds.length > 1 && (
            <select
              value={world.id}
              onChange={(e) => setSelectedWorldId(e.target.value)}
              style={{ ...inputStyle, width: 200 }}
            >
              {project.worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleCreateWorld}
            style={{
              padding: '7px 12px',
              backgroundColor: '#161f30',
              border: '1px solid #262f42',
              borderRadius: 6,
              color: '#34d399',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Plus size={13} /> Novo Mundo
          </button>
        </div>
      </div>

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
                  onChange={(e) => upsertWorld({ ...world, magicOrTechSummary: e.target.value })}
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Geopolítica & Tensão entre Facções</label>
                <textarea
                  rows={3}
                  value={world.politicsSummary}
                  onChange={(e) => upsertWorld({ ...world, politicsSummary: e.target.value })}
                  style={textareaStyle}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'locations' && (
          <WorldLocationsTab world={world} factions={project.factions} onUpdateWorld={upsertWorld} />
        )}

        {tab === 'systems' && (
          <WorldSystemsTab world={world} onUpdateWorld={upsertWorld} />
        )}

        {tab === 'timeline' && (
          <WorldTimelineTab world={world} onUpdateWorld={upsertWorld} />
        )}
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
