import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Sparkles,
  Trash2,
  Search,
  Lock,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  type Character,
  type CharacterArchetype,
} from '../types/project';
import { CompletenessRing } from '../components/ui/CompletenessRing';

export function CharacterStudioView() {
  const { project, upsertCharacter, deleteCharacter } = useProject();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'completeDesc' | 'completeAsc'>('completeDesc');
  const [selectedId, setSelectedId] = useState<string>(
    project.characters[0]?.id ?? ''
  );
  const [activeTab, setActiveTab] = useState<'profile' | 'arc' | 'relationships' | 'epistemic' | 'notes'>('profile');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiConcept, setAiConcept] = useState('');
  const [newSecretText, setNewSecretText] = useState('');

  const filteredCharacters = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = project.characters.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
    return list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const ca = calculateCharacterCompleteness(a);
      const cb = calculateCharacterCompleteness(b);
      return sortBy === 'completeDesc' ? cb - ca : ca - cb;
    });
  }, [project.characters, search, sortBy]);

  const selected =
    project.characters.find((c) => c.id === selectedId) ?? filteredCharacters[0];

  const avgCompleteness = useMemo(() => {
    if (project.characters.length === 0) return 0;
    const sum = project.characters.reduce(
      (acc, c) => acc + calculateCharacterCompleteness(c),
      0
    );
    return Math.round(sum / project.characters.length);
  }, [project.characters]);

  const developedCount = project.characters.filter(
    (c) => calculateCharacterCompleteness(c) >= 80
  ).length;

  const handleCreateManual = () => {
    const newChar: Character = {
      id: `char_${Date.now()}`,
      name: 'Novo Personagem',
      aliases: [],
      role: 'Coadjuvante',
      archetype: 'ally',
      status: 'draft',
      avatarColor: '#3b82f6',
      appearance: '',
      backstory: '',
      motivation: '',
      personalityTraits: '',
      flaws: '',
      want: '',
      need: '',
      lieBelieved: '',
      ghost: '',
      arcAct1: '',
      arcAct2: '',
      arcAct3: '',
      characterArc: '',
      notes: '',
      tags: [],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertCharacter(newChar);
    setSelectedId(newChar.id);
  };

  const handleCreateWithAi = () => {
    const concept = aiConcept.trim() || 'um estrategista marcado pelo passado';
    const newChar: Character = {
      id: `char_${Date.now()}`,
      name: concept.split(' ').slice(0, 3).join(' '),
      aliases: ['O Silencioso'],
      role: 'Personagem Gerado',
      archetype: 'shapeshifter',
      status: 'provisional',
      avatarColor: '#a855f7',
      appearance: `Presença marcante que reflete sua origem ligada a: ${concept}.`,
      backstory: `Moldado por eventos formativos severos ligados a ${concept}, carrega dívidas antigas com as facções locais.`,
      motivation: `Um desejo central conectado a ${concept} guia todas as suas escolhas.`,
      personalityTraits: 'Engenhoso, reservado, determinado sob pressão.',
      flaws: 'Desconfiança profunda que complica alianças duradouras.',
      want: `Conquistar autonomia e resolver a pendência de ${concept}.`,
      need: 'Aprender a confiar nos aliados antes do colapso final.',
      lieBelieved: 'Acredita que qualquer vínculo pessoal é uma vulnerabilidade explorável.',
      ghost: 'Um juramento quebrado durante a crise anterior.',
      arcAct1: 'Atua nas sombras defendendo apenas seus próprios interesses.',
      arcAct2: 'Forçado a escolher um lado quando o conflito atinge seus protegidos.',
      arcAct3: 'Assume o risco final para salvar o grupo.',
      characterArc: `Começa fechado em si mesmo e, ao longo da trama, é transformado por ${concept}.`,
      notes: '',
      tags: ['gerado', 'elenco'],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertCharacter(newChar);
    setSelectedId(newChar.id);
    setAiConcept('');
    setShowAiModal(false);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 46px)', overflow: 'hidden' }}>
      {/* Left Roster Column */}
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
        {/* Roster Header & Stats */}
        <div style={{ padding: 14, borderBottom: '1px solid #1b202c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>
              <Users size={16} color="#60a5fa" /> Dossiês de Personagens
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleCreateManual}
                title="Adicionar manualmente"
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
                <Plus size={13} /> Novo
              </button>
              <button
                onClick={() => setShowAiModal(true)}
                title="Gerar com IA"
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

          {/* Stats strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginBottom: 10,
              fontSize: 11,
            }}
          >
            <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
              <div style={{ color: '#9ca3af' }}>Total</div>
              <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: 13 }}>{project.characters.length}</div>
            </div>
            <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
              <div style={{ color: '#9ca3af' }}>Média compl.</div>
              <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 13 }}>{avgCompleteness}%</div>
            </div>
            <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
              <div style={{ color: '#9ca3af' }}>Desenvolvidos</div>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>{developedCount}</div>
            </div>
          </div>

          {/* Search & Sort */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={13} color="#6b7280" style={{ position: 'absolute', left: 8, top: 8 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar personagens..."
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                backgroundColor: '#141824',
                border: '1px solid #242b3d',
                borderRadius: 6,
                color: '#d1d5db',
                fontSize: 11,
                padding: '0 6px',
              }}
            >
              <option value="completeDesc">Mais completo</option>
              <option value="completeAsc">Menos completo</option>
              <option value="name">Nome (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Character Cards List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredCharacters.map((c) => {
            const pct = calculateCharacterCompleteness(c);
            const active = selected?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: active ? '#172033' : '#131722',
                  border: active ? '1px solid #3b82f6' : '1px solid #1f2533',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      backgroundColor: c.avatarColor || '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {c.role} · <span style={{ color: '#60a5fa' }}>{c.archetype}</span>
                    </div>
                  </div>
                </div>
                <CompletenessRing percent={pct} size={36} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Full Character Dossier Editor */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Dossier Top Header */}
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
              <CompletenessRing percent={calculateCharacterCompleteness(selected)} size={48} strokeWidth={4} />
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#f9fafb' }}>
                  Dossiê: {selected.name}
                </h2>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
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

          {/* Dossier Tabs */}
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
                  borderBottom: activeTab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
                  background: 'transparent',
                  color: activeTab === t.id ? '#60a5fa' : '#9ca3af',
                  fontSize: 12.5,
                  fontWeight: activeTab === t.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
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
                      backgroundColor: '#131824',
                      border: '1px solid #242c3d',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: 13 }}>
                      Alvo: {r.targetId} · Tipo: <span style={{ color: '#60a5fa' }}>{r.type}</span> · Força: {r.strength}/10
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      {r.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'epistemic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12.5, color: '#9ca3af' }}>
                  Controle o que este personagem esconde e quem mais sabe sobre cada segredo.
                </div>
                {selected.epistemicSecrets.map((sec) => (
                  <div
                    key={sec.id}
                    style={{
                      padding: 14,
                      backgroundColor: '#131824',
                      border: '1px solid rgba(245,158,11,0.35)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>
                      <Lock size={14} /> {sec.secret}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
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
      ) : null}

      {/* AI Character Modal */}
      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 140,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 460,
              backgroundColor: '#121621',
              border: '1px solid #283044',
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#f3f4f6' }}>
              Gerar Personagem com IA
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
              Descreva um conceito central e o estúdio criará um perfil completo com backstory, motivação, arco em 3 atos e falhas.
            </p>
            <input
              value={aiConcept}
              onChange={(e) => setAiConcept(e.target.value)}
              placeholder="Ex.: Um contrabandista veterano que conhece as passagens submersas..."
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowAiModal(false)}
                style={{
                  padding: '7px 12px',
                  background: 'transparent',
                  border: '1px solid #2c3548',
                  borderRadius: 6,
                  color: '#9ca3af',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWithAi}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#7c3aed',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Gerar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
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
