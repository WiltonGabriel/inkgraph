import { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Sparkles,
  Trash2,
  Search,
  Lock,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  calculateFactionCompleteness,
  type Faction,
} from '../types/project';
import { CompletenessRing } from '../components/ui/CompletenessRing';

export function FactionsStudioView() {
  const { project, upsertFaction, deleteFaction } = useProject();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    project.factions[0]?.id ?? ''
  );
  const [activeTab, setActiveTab] = useState<
    'doctrine' | 'hierarchy' | 'diplomacy' | 'secrets'
  >('doctrine');
  const [newRankTitle, setNewRankTitle] = useState('');
  const [newRankResp, setNewRankResp] = useState('');

  const filteredFactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return project.factions.filter(
      (f) =>
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.subtype.toLowerCase().includes(q)
    );
  }, [project.factions, search]);

  const selected =
    project.factions.find((f) => f.id === selectedId) ?? filteredFactions[0];

  const avgCompleteness = useMemo(() => {
    if (project.factions.length === 0) return 0;
    const sum = project.factions.reduce(
      (acc, f) => acc + calculateFactionCompleteness(f),
      0
    );
    return Math.round(sum / project.factions.length);
  }, [project.factions]);

  const handleCreateFaction = (withAi = false) => {
    const newFaction: Faction = {
      id: `faction_${Date.now()}`,
      name: withAi ? 'Círculo dos Artífices Cinzentos' : 'Nova Facção',
      aliases: withAi ? ['A Guilda das Válvulas'] : [],
      subtype: withAi ? 'Guilda Tecnocrática & Sindicato' : 'Ordem / Organização',
      motto: withAi ? 'Nenhuma engrenagem gira sem tributo.' : '',
      color: '#a855f7',
      status: 'provisional',
      publicAgenda: withAi
        ? 'Manutenção da infraestrutura térmica dos anéis médios.'
        : '',
      secretAgenda: withAi
        ? 'Acumular reservas clandestinas de piro-cristal para chantagear o Conselho.'
        : '',
      doctrine: withAi
        ? 'O conhecimento técnico deve permanecer restrito aos iniciados.'
        : '',
      history: withAi
        ? 'Formada pelos engenheiros sobreviventes da Segunda Reforma.'
        : '',
      resourcesAndPower: withAi
        ? 'Controle das oficinas de fundição e mapas das tubulações primárias.'
        : '',
      internalConflicts: withAi
        ? 'Disputa entre os mestres conservadores e os jovens sabotadores.'
        : '',
      notes: '',
      ranks: withAi
        ? [
            {
              id: `rk_${Date.now()}`,
              title: 'Grão-Artífice',
              authorityLevel: 10,
              holderIds: [],
              responsibilities: 'Controle do cofre de diagramas e negociação com a Coroa.',
            },
          ]
        : [],
      controlledLocationIds: [],
      tags: ['faccao'],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertFaction(newFaction);
    setSelectedId(newFaction.id);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 46px)', overflow: 'hidden' }}>
      {/* Left Factions Roster */}
      <div
        style={{
          width: 340,
          backgroundColor: '#0e1118',
          borderRight: '1px solid #1b202c',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: 14, borderBottom: '1px solid #1b202c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>
              <Shield size={16} color="#ef4444" /> Facções & Ordens
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handleCreateFaction(false)}
                style={{
                  padding: '5px 8px',
                  backgroundColor: '#1a2030',
                  border: '1px solid #2c3548',
                  borderRadius: 6,
                  color: '#e5e7eb',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus size={13} /> Nova
              </button>
              <button
                onClick={() => handleCreateFaction(true)}
                style={{
                  padding: '5px 8px',
                  backgroundColor: 'rgba(167,139,250,0.15)',
                  border: '1px solid rgba(167,139,250,0.35)',
                  borderRadius: 6,
                  color: '#c4b5fd',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles size={13} /> IA
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10, fontSize: 11 }}>
            <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
              <div style={{ color: '#9ca3af' }}>Total de Facções</div>
              <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: 13 }}>{project.factions.length}</div>
            </div>
            <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
              <div style={{ color: '#9ca3af' }}>Média completa</div>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>{avgCompleteness}%</div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={13} color="#6b7280" style={{ position: 'absolute', left: 8, top: 8 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar facções..."
              style={{
                width: '100%',
                padding: '6px 8px 6px 26px',
                backgroundColor: '#141824',
                border: '1px solid #242b3d',
                borderRadius: 6,
                color: '#f3f4f6',
                fontSize: 12,
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredFactions.map((f) => {
            const pct = calculateFactionCompleteness(f);
            const active = selected?.id === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: active ? '#172033' : '#131722',
                  border: active ? '1px solid #ef4444' : '1px solid #1f2533',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.subtype}</div>
                </div>
                <CompletenessRing percent={pct} size={36} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Faction Dossier Editor */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
              <CompletenessRing percent={calculateFactionCompleteness(selected)} size={48} strokeWidth={4} />
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#f9fafb' }}>{selected.name}</h2>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {selected.subtype} · Lema: “{selected.motto || 'Sem lema'}”
                </div>
              </div>
            </div>
            <button
              onClick={() => deleteFaction(selected.id)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6,
                color: '#f87171',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={13} /> Excluir
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '0 24px',
              backgroundColor: '#10141d',
              borderBottom: '1px solid #1b202c',
            }}
          >
            {[
              { id: 'doctrine', label: 'Doutrina, Agendas & História' },
              { id: 'hierarchy', label: `Hierarquia & Poder (${selected.ranks.length})` },
              { id: 'diplomacy', label: `Diplomacia & Alianças (${selected.relationships.length})` },
              { id: 'secrets', label: `Segredos de Estado (${selected.epistemicSecrets.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: activeTab === t.id ? '2px solid #ef4444' : '2px solid transparent',
                  background: 'transparent',
                  color: activeTab === t.id ? '#f87171' : '#9ca3af',
                  fontSize: 12.5,
                  fontWeight: activeTab === t.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 920 }}>
            {activeTab === 'doctrine' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Nome da Facção</label>
                    <input
                      value={selected.name}
                      onChange={(e) => upsertFaction({ ...selected, name: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Subtipo Politico/Institucional</label>
                    <input
                      value={selected.subtype}
                      onChange={(e) => upsertFaction({ ...selected, subtype: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Lema Oficial (Motto)</label>
                  <input
                    value={selected.motto}
                    onChange={(e) => upsertFaction({ ...selected, motto: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Agenda Pública (Propaganda)</label>
                    <textarea
                      rows={3}
                      value={selected.publicAgenda}
                      onChange={(e) => upsertFaction({ ...selected, publicAgenda: e.target.value })}
                      style={textareaStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Agenda Secreta (Objetivo Real)</label>
                    <textarea
                      rows={3}
                      value={selected.secretAgenda}
                      onChange={(e) => upsertFaction({ ...selected, secretAgenda: e.target.value })}
                      style={textareaStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Doutrina, Dogmas & Código Interno</label>
                  <textarea
                    rows={3}
                    value={selected.doctrine}
                    onChange={(e) => upsertFaction({ ...selected, doctrine: e.target.value })}
                    style={textareaStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>História de Fundação & Evolução</label>
                  <textarea
                    rows={4}
                    value={selected.history}
                    onChange={(e) => upsertFaction({ ...selected, history: e.target.value })}
                    style={textareaStyle}
                  />
                </div>
              </div>
            )}

            {activeTab === 'hierarchy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Recursos, Poder Militar & Economia</label>
                  <textarea
                    rows={3}
                    value={selected.resourcesAndPower}
                    onChange={(e) =>
                      upsertFaction({ ...selected, resourcesAndPower: e.target.value })
                    }
                    style={textareaStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Conflitos Internos & Facções Dissidentes</label>
                  <textarea
                    rows={3}
                    value={selected.internalConflicts}
                    onChange={(e) =>
                      upsertFaction({ ...selected, internalConflicts: e.target.value })
                    }
                    style={textareaStyle}
                  />
                </div>

                <h4 style={{ margin: '8px 0 0', fontSize: 13.5, color: '#f3f4f6' }}>
                  Patentes & Cargos da Hierarquia
                </h4>
                {selected.ranks.map((rk) => (
                  <div
                    key={rk.id}
                    style={{
                      padding: 12,
                      backgroundColor: '#131824',
                      border: '1px solid #242c3d',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 13 }}>
                      {rk.title} (Autoridade {rk.authorityLevel}/10)
                    </div>
                    <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 4 }}>
                      {rk.responsibilities}
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={newRankTitle}
                    onChange={(e) => setNewRankTitle(e.target.value)}
                    placeholder="Título da patente (ex.: Alto Inquisidor)..."
                    style={inputStyle}
                  />
                  <input
                    value={newRankResp}
                    onChange={(e) => setNewRankResp(e.target.value)}
                    placeholder="Responsabilidades..."
                    style={inputStyle}
                  />
                  <button
                    onClick={() => {
                      if (!newRankTitle.trim()) return;
                      upsertFaction({
                        ...selected,
                        ranks: [
                          ...selected.ranks,
                          {
                            id: `rk_${Date.now()}`,
                            title: newRankTitle.trim(),
                            authorityLevel: 7,
                            holderIds: [],
                            responsibilities: newRankResp.trim(),
                          },
                        ],
                      });
                      setNewRankTitle('');
                      setNewRankResp('');
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + Cargo
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'diplomacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.relationships.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 12,
                      backgroundColor: '#131824',
                      border: '1px solid #242c3d',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: 13 }}>
                      Alvo: {r.targetId} · [{r.type}] · Força {r.strength}/10
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      {r.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'secrets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.epistemicSecrets.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: 12,
                      backgroundColor: '#131824',
                      border: '1px solid rgba(245,158,11,0.35)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>
                      <Lock size={14} /> {s.secret}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      Conhecido por: {s.knownByIds.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
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
