import { useState } from 'react';
import { Trash2, Lock } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  type Character,
  type CharacterArchetype,
} from '../../types/project';
import { CompletenessRing } from '../ui/CompletenessRing';

interface CharacterDossierTabsProps {
  selected: Character;
}

export function CharacterDossierTabs({ selected }: CharacterDossierTabsProps) {
  const { project, upsertCharacter, deleteCharacter } = useProject();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'arc' | 'relationships' | 'epistemic' | 'notes'
  >('profile');
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
            percent={calculateCharacterCompleteness(selected)}
            size={48}
            strokeWidth={4}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary, #f1f5f9)' }}>
              Dossiê: {selected.name}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 2 }}>
              {selected.role} · Arquétipo: {selected.archetype} · Status: {selected.status}
            </div>
          </div>
        </div>
        <button
          onClick={() => deleteCharacter(selected.id)}
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
          { id: 'profile', label: 'Perfil & História' },
          { id: 'arc', label: 'Psicologia & Arco (3 Atos)' },
          { id: 'relationships', label: `Relacionamentos (${selected.relationships.length})` },
          { id: 'epistemic', label: `Segredos Epistêmicos (${selected.epistemicSecrets.length})` },
          { id: 'notes', label: 'Notas & Tags' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderBottom:
                activeTab === t.id ? '2px solid var(--accent-primary, #3b82f6)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === t.id ? 'var(--accent-primary, #3b82f6)' : 'var(--text-secondary, #94a3b8)',
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
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input
                  value={selected.name}
                  onChange={(e) => upsertCharacter({ ...selected, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Papel na Trama</label>
                <input
                  value={selected.role}
                  onChange={(e) => upsertCharacter({ ...selected, role: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Arquétipo Junguiano</label>
                <select
                  value={selected.archetype}
                  onChange={(e) =>
                    upsertCharacter({
                      ...selected,
                      archetype: e.target.value as CharacterArchetype,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="hero">Herói</option>
                  <option value="mentor">Mentor</option>
                  <option value="villain">Vilão</option>
                  <option value="shadow">Sombra</option>
                  <option value="trickster">Malandro (Trickster)</option>
                  <option value="shapeshifter">Metamorfo</option>
                  <option value="herald">Arauto</option>
                  <option value="ally">Aliado</option>
                  <option value="threshold-guardian">Guardião do Limiar</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Facção Principal</label>
                <select
                  value={selected.factionId ?? ''}
                  onChange={(e) =>
                    upsertCharacter({
                      ...selected,
                      factionId: e.target.value || undefined,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">Sem facção</option>
                  {project.factions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Localização Atual</label>
                <select
                  value={selected.locationId ?? ''}
                  onChange={(e) =>
                    upsertCharacter({
                      ...selected,
                      locationId: e.target.value || undefined,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">Sem local fixo</option>
                  {(project.worlds[0]?.locations ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Codinomes (separados por vírgula)</label>
                <input
                  value={selected.aliases.join(', ')}
                  onChange={(e) =>
                    upsertCharacter({
                      ...selected,
                      aliases: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Aparência</label>
              <textarea
                rows={3}
                value={selected.appearance}
                onChange={(e) => upsertCharacter({ ...selected, appearance: e.target.value })}
                style={textareaStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>História de Fundo (Backstory)</label>
              <textarea
                rows={4}
                value={selected.backstory}
                onChange={(e) => upsertCharacter({ ...selected, backstory: e.target.value })}
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Motivação</label>
                <textarea
                  rows={3}
                  value={selected.motivation}
                  onChange={(e) => upsertCharacter({ ...selected, motivation: e.target.value })}
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Traços de Personalidade</label>
                <textarea
                  rows={3}
                  value={selected.personalityTraits}
                  onChange={(e) =>
                    upsertCharacter({ ...selected, personalityTraits: e.target.value })
                  }
                  style={textareaStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Imperfeições & Falhas Trágicas (Flaws)</label>
              <textarea
                rows={2}
                value={selected.flaws}
                onChange={(e) => upsertCharacter({ ...selected, flaws: e.target.value })}
                style={textareaStyle}
              />
            </div>
          </div>
        )}

        {activeTab === 'arc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Desejo Consciente (Want)</label>
                <textarea
                  rows={3}
                  value={selected.want}
                  onChange={(e) => upsertCharacter({ ...selected, want: e.target.value })}
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Necessidade Inconsciente (Need)</label>
                <textarea
                  rows={3}
                  value={selected.need}
                  onChange={(e) => upsertCharacter({ ...selected, need: e.target.value })}
                  style={textareaStyle}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>A Mentira em que Acredita (The Lie)</label>
                <textarea
                  rows={3}
                  value={selected.lieBelieved}
                  onChange={(e) =>
                    upsertCharacter({ ...selected, lieBelieved: e.target.value })
                  }
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>O Fantasma / Ferida de Origem (The Ghost)</label>
                <textarea
                  rows={3}
                  value={selected.ghost}
                  onChange={(e) => upsertCharacter({ ...selected, ghost: e.target.value })}
                  style={textareaStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Síntese do Arco do Personagem</label>
              <textarea
                rows={2}
                value={selected.characterArc}
                onChange={(e) =>
                  upsertCharacter({ ...selected, characterArc: e.target.value })
                }
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Ato I — Ponto de Partida</label>
                <textarea
                  rows={4}
                  value={selected.arcAct1}
                  onChange={(e) => upsertCharacter({ ...selected, arcAct1: e.target.value })}
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Ato II — Crise e Mudança</label>
                <textarea
                  rows={4}
                  value={selected.arcAct2}
                  onChange={(e) => upsertCharacter({ ...selected, arcAct2: e.target.value })}
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Ato III — Desfecho do Arco</label>
                <textarea
                  rows={4}
                  value={selected.arcAct3}
                  onChange={(e) => upsertCharacter({ ...selected, arcAct3: e.target.value })}
                  style={textareaStyle}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'relationships' && (
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
                  Alvo: {r.targetId} · Tipo: <span style={{ color: 'var(--accent-primary, #3b82f6)' }}>{r.type}</span> · Força: {r.strength}/10
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'epistemic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary, #94a3b8)' }}>
              Controle o que este personagem esconde e quem mais sabe sobre cada segredo.
            </div>
            {selected.epistemicSecrets.map((sec) => (
              <div
                key={sec.id}
                style={{
                  padding: 14,
                  backgroundColor: 'var(--bg-elevated, #171d2e)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 'var(--radius-md, 8px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>
                  <Lock size={14} /> {sec.secret}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 6 }}>
                  Conhecido por: {sec.knownByIds.join(', ')}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newSecretText}
                onChange={(e) => setNewSecretText(e.target.value)}
                placeholder="Novo segredo epistêmico mantido por este personagem..."
                style={inputStyle}
              />
              <button
                onClick={() => {
                  if (!newSecretText.trim()) return;
                  upsertCharacter({
                    ...selected,
                    epistemicSecrets: [
                      ...selected.epistemicSecrets,
                      {
                        id: `sec_${Date.now()}`,
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
                Adicionar Segredo
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Tags (separadas por vírgula)</label>
              <input
                value={selected.tags.join(', ')}
                onChange={(e) =>
                  upsertCharacter({
                    ...selected,
                    tags: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Notas Livres do Autor</label>
              <textarea
                rows={6}
                value={selected.notes}
                onChange={(e) => upsertCharacter({ ...selected, notes: e.target.value })}
                style={textareaStyle}
              />
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
