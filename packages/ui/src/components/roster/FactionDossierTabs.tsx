import { useState } from 'react';
import { Trash2, Lock } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  calculateFactionCompleteness,
  type Faction,
} from '../../types/project';
import { CompletenessRing } from '../ui/CompletenessRing';

interface FactionDossierTabsProps {
  selected: Faction;
}

export function FactionDossierTabs({ selected }: FactionDossierTabsProps) {
  const { upsertFaction, deleteFaction } = useProject();
  const [activeTab, setActiveTab] = useState<
    'doctrine' | 'hierarchy' | 'diplomacy' | 'secrets'
  >('doctrine');
  const [newRankTitle, setNewRankTitle] = useState('');
  const [newRankResp, setNewRankResp] = useState('');
  const [newSecretText, setNewSecretText] = useState('');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: 'var(--bg-surface, #111623)',
          borderBottom: '1px solid var(--border-subtle, #263046)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <CompletenessRing
            percent={calculateFactionCompleteness(selected)}
            size={48}
            strokeWidth={4}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary, #f1f5f9)' }}>
              {selected.name}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 2 }}>
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
          backgroundColor: 'var(--bg-surface, #111623)',
          borderBottom: '1px solid var(--border-subtle, #263046)',
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
              borderBottom:
                activeTab === t.id ? '2px solid #ef4444' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === t.id ? '#ef4444' : 'var(--text-secondary, #94a3b8)',
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
                  onChange={(e) =>
                    upsertFaction({ ...selected, publicAgenda: e.target.value })
                  }
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Agenda Secreta (Objetivo Real)</label>
                <textarea
                  rows={3}
                  value={selected.secretAgenda}
                  onChange={(e) =>
                    upsertFaction({ ...selected, secretAgenda: e.target.value })
                  }
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

            <h4 style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--text-primary, #f1f5f9)' }}>
              Patentes & Cargos da Hierarquia
            </h4>
            {selected.ranks.map((rk) => (
              <div
                key={rk.id}
                style={{
                  padding: 12,
                  backgroundColor: 'var(--bg-elevated, #171d2e)',
                  border: '1px solid var(--border-subtle, #263046)',
                  borderRadius: 'var(--radius-md, 8px)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--accent-primary, #3b82f6)', fontSize: 13 }}>
                  {rk.title} (Autoridade {rk.authorityLevel}/10)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
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
                  backgroundColor: 'var(--bg-elevated, #171d2e)',
                  border: '1px solid var(--border-subtle, #263046)',
                  borderRadius: 'var(--radius-md, 8px)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', fontSize: 13 }}>
                  Alvo: {r.targetId} · [{r.type}] · Força {r.strength}/10
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'secrets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary, #94a3b8)' }}>
              Controle segredos institucionais mantidos por esta facção e quem os conhece.
            </div>
            {selected.epistemicSecrets.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: 12,
                  backgroundColor: 'var(--bg-elevated, #171d2e)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 'var(--radius-md, 8px)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>
                    <Lock size={14} /> {s.secret}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
                    Conhecido por: {s.knownByIds.join(', ')}
                  </div>
                </div>
                <button
                  onClick={() =>
                    upsertFaction({
                      ...selected,
                      epistemicSecrets: selected.epistemicSecrets.filter((sec) => sec.id !== s.id),
                    })
                  }
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.35)',
                    color: '#f87171',
                    borderRadius: 5,
                    padding: '4px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newSecretText}
                onChange={(e) => setNewSecretText(e.target.value)}
                placeholder="Novo segredo de estado ou agenda oculta..."
                style={inputStyle}
              />
              <button
                onClick={() => {
                  if (!newSecretText.trim()) return;
                  upsertFaction({
                    ...selected,
                    epistemicSecrets: [
                      ...selected.epistemicSecrets,
                      {
                        id: `sec_fac_${Date.now()}`,
                        secret: newSecretText.trim(),
                        knownByIds: [selected.id],
                      },
                    ],
                  });
                  setNewSecretText('');
                }}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#f59e0b',
                  color: '#111827',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Segredo
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
  color: 'var(--text-secondary, #94a3b8)',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-elevated, #171d2e)',
  border: '1px solid var(--border-subtle, #263046)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '8px 10px',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: 13,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-elevated, #171d2e)',
  border: '1px solid var(--border-subtle, #263046)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '9px 11px',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: 13,
  lineHeight: 1.5,
  resize: 'vertical',
};
