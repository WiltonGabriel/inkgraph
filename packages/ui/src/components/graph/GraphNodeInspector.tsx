import { useState } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  type EntityRelationship,
  type RelationshipType,
} from '../../types/project';
import { CompletenessRing } from '../ui/CompletenessRing';
import { REL_COLORS, type GraphNode } from './graphDataBuilder';

interface GraphNodeInspectorProps {
  selectedNodeId: string;
  setSelectedNodeId: (id: string) => void;
  allEntities: GraphNode[];
}

export function GraphNodeInspector({
  selectedNodeId,
  setSelectedNodeId,
  allEntities,
}: GraphNodeInspectorProps) {
  const {
    project,
    upsertCharacter,
    upsertFaction,
    upsertWorld,
    upsertObject,
  } = useProject();

  const [inspectorTab, setInspectorTab] = useState<
    'formulation' | 'deep' | 'relations' | 'epistemic'
  >('formulation');
  const [newRelTargetId, setNewRelTargetId] = useState<string>('');
  const [newRelType, setNewRelType] = useState<RelationshipType>('ally');
  const [newRelLabel, setNewRelLabel] = useState<string>('');
  const [newRelStrength, setNewRelStrength] = useState<number>(7);

  const primaryWorld = project.worlds[0];
  const selectedChar = project.characters.find((c) => c.id === selectedNodeId);
  const selectedFaction = project.factions.find((f) => f.id === selectedNodeId);
  const selectedLocation = primaryWorld?.locations.find(
    (l) => l.id === selectedNodeId
  );
  const selectedSystem = primaryWorld?.systems.find(
    (s) => s.id === selectedNodeId
  );
  const selectedObject = project.objects.find((o) => o.id === selectedNodeId);

  const handleAddRelationship = () => {
    if (!newRelTargetId || !newRelLabel.trim()) return;
    const targetNode = allEntities.find((e) => e.id === newRelTargetId);
    if (!targetNode) return;

    const newRel: EntityRelationship = {
      id: `rel_${Date.now()}`,
      targetId: targetNode.id,
      targetKind: targetNode.kind,
      type: newRelType,
      label: newRelLabel.trim(),
      strength: newRelStrength,
      sentiment:
        newRelType === 'enemy' || newRelType === 'war' || newRelType === 'rival'
          ? -0.8
          : 0.7,
    };

    if (selectedChar) {
      upsertCharacter({
        ...selectedChar,
        relationships: [...selectedChar.relationships, newRel],
      });
    } else if (selectedFaction) {
      upsertFaction({
        ...selectedFaction,
        relationships: [...selectedFaction.relationships, newRel],
      });
    }
    setNewRelLabel('');
  };

  const handleDeleteRelationship = (relId: string) => {
    if (selectedChar) {
      upsertCharacter({
        ...selectedChar,
        relationships: selectedChar.relationships.filter((r) => r.id !== relId),
      });
    } else if (selectedFaction) {
      upsertFaction({
        ...selectedFaction,
        relationships: selectedFaction.relationships.filter((r) => r.id !== relId),
      });
    }
  };

  return (
    <aside
      style={{
        width: 470,
        backgroundColor: '#0e1118',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1b202c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#60a5fa', fontWeight: 700 }}>
            Dossiê & Formulação Completa no Grafo
          </div>
          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            style={{
              marginTop: 4,
              width: '100%',
              backgroundColor: '#151a26',
              border: '1px solid #283044',
              borderRadius: 6,
              padding: '6px 8px',
              color: '#f9fafb',
              fontSize: 13.5,
              fontWeight: 700,
            }}
          >
            <optgroup label="Personagens">
              {project.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </optgroup>
            <optgroup label="Facções & Organizações">
              {project.factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.subtype})
                </option>
              ))}
            </optgroup>
            <optgroup label="Locais">
              {(primaryWorld?.locations ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.type})
                </option>
              ))}
            </optgroup>
            <optgroup label="Sistemas & Objetos">
              {(primaryWorld?.systems ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.subtype})
                </option>
              ))}
              {project.objects.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {selectedChar && (
          <CompletenessRing percent={calculateCharacterCompleteness(selectedChar)} size={42} />
        )}
        {selectedFaction && (
          <CompletenessRing percent={calculateFactionCompleteness(selectedFaction)} size={42} />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1b202c',
          backgroundColor: '#121620',
        }}
      >
        {[
          { id: 'formulation', label: '1. Perfil & Formulação' },
          { id: 'deep', label: selectedFaction ? '2. Poder & Hierarquia' : '2. Psicologia & Arco' },
          { id: 'relations', label: '3. Relações & Grafo' },
          { id: 'epistemic', label: '4. Epistêmico' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setInspectorTab(t.id as typeof inspectorTab)}
            style={{
              flex: 1,
              padding: '9px 6px',
              border: 'none',
              borderBottom:
                inspectorTab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: inspectorTab === t.id ? '#60a5fa' : '#9ca3af',
              fontSize: 11.5,
              fontWeight: inspectorTab === t.id ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {selectedChar && inspectorTab === 'formulation' && (
          <>
            <Field label="Nome & Codinomes (Aliases)">
              <input
                value={selectedChar.name}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, name: e.target.value })
                }
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Codinomes: {selectedChar.aliases.join(', ') || 'Nenhum'}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Papel Narrativo">
                <input
                  value={selectedChar.role}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, role: e.target.value })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Idade / Status">
                <input
                  value={selectedChar.age ?? ''}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, age: e.target.value })
                  }
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field label="Aparência Física & Presença">
              <textarea
                rows={3}
                value={selectedChar.appearance}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, appearance: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="História de Fundo (Backstory)">
              <textarea
                rows={4}
                value={selectedChar.backstory}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, backstory: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Motivação Central">
              <textarea
                rows={2}
                value={selectedChar.motivation}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, motivation: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Traços de Personalidade">
              <textarea
                rows={2}
                value={selectedChar.personalityTraits}
                onChange={(e) =>
                  upsertCharacter({
                    ...selectedChar,
                    personalityTraits: e.target.value,
                  })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Imperfeições & Falhas (Flaws)">
              <textarea
                rows={2}
                value={selectedChar.flaws}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, flaws: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
          </>
        )}

        {selectedChar && inspectorTab === 'deep' && (
          <>
            <Field label="Desejo Consciente (Want)">
              <textarea
                rows={2}
                value={selectedChar.want}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, want: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Necessidade Inconsciente (Need)">
              <textarea
                rows={2}
                value={selectedChar.need}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, need: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Mentira em que Acredita (The Lie)">
              <textarea
                rows={2}
                value={selectedChar.lieBelieved}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, lieBelieved: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Fantasma / Trauma Passado (The Ghost)">
              <textarea
                rows={2}
                value={selectedChar.ghost}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, ghost: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Arco — Ato I (Configuração)">
              <textarea
                rows={2}
                value={selectedChar.arcAct1}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, arcAct1: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Arco — Ato II (Confronto)">
              <textarea
                rows={2}
                value={selectedChar.arcAct2}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, arcAct2: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Arco — Ato III (Resolução)">
              <textarea
                rows={2}
                value={selectedChar.arcAct3}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, arcAct3: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Notas de Voz & Detalhes">
              <textarea
                rows={2}
                value={selectedChar.notes}
                onChange={(e) =>
                  upsertCharacter({ ...selectedChar, notes: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
          </>
        )}

        {selectedFaction && inspectorTab === 'formulation' && (
          <>
            <Field label="Nome da Facção">
              <input
                value={selectedFaction.name}
                onChange={(e) =>
                  upsertFaction({ ...selectedFaction, name: e.target.value })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Subtipo / Categoria">
              <input
                value={selectedFaction.subtype}
                onChange={(e) =>
                  upsertFaction({ ...selectedFaction, subtype: e.target.value })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Lema (Motto)">
              <input
                value={selectedFaction.motto}
                onChange={(e) =>
                  upsertFaction({ ...selectedFaction, motto: e.target.value })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Agenda Pública (Oficial)">
              <textarea
                rows={2}
                value={selectedFaction.publicAgenda}
                onChange={(e) =>
                  upsertFaction({
                    ...selectedFaction,
                    publicAgenda: e.target.value,
                  })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Agenda Secreta (Real)">
              <textarea
                rows={2}
                value={selectedFaction.secretAgenda}
                onChange={(e) =>
                  upsertFaction({
                    ...selectedFaction,
                    secretAgenda: e.target.value,
                  })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Doutrina & Ideologia">
              <textarea
                rows={3}
                value={selectedFaction.doctrine}
                onChange={(e) =>
                  upsertFaction({ ...selectedFaction, doctrine: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="História de Fundação">
              <textarea
                rows={3}
                value={selectedFaction.history}
                onChange={(e) =>
                  upsertFaction({ ...selectedFaction, history: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
          </>
        )}

        {selectedFaction && inspectorTab === 'deep' && (
          <>
            <Field label="Recursos, Efetivo Militar & Monopólios">
              <textarea
                rows={3}
                value={selectedFaction.resourcesAndPower}
                onChange={(e) =>
                  upsertFaction({
                    ...selectedFaction,
                    resourcesAndPower: e.target.value,
                  })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Conflitos Internos & Cismas">
              <textarea
                rows={3}
                value={selectedFaction.internalConflicts}
                onChange={(e) =>
                  upsertFaction({
                    ...selectedFaction,
                    internalConflicts: e.target.value,
                  })
                }
                style={textareaStyle}
              />
            </Field>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', marginTop: 6 }}>
              Estrutura Hierárquica ({selectedFaction.ranks.length} patentes)
            </div>
            {selectedFaction.ranks.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: 10,
                  backgroundColor: '#151a26',
                  border: '1px solid #252d40',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: '#60a5fa' }}>
                  {r.title} (Autoridade {r.authorityLevel}/10)
                </div>
                <div style={{ color: '#9ca3af', fontSize: 11.5, marginTop: 3 }}>
                  {r.responsibilities}
                </div>
              </div>
            ))}
          </>
        )}

        {selectedLocation && (
          <>
            <Field label="Nome do Local">
              <input
                value={selectedLocation.name}
                onChange={(e) => {
                  if (!primaryWorld) return;
                  upsertWorld({
                    ...primaryWorld,
                    locations: primaryWorld.locations.map((l) =>
                      l.id === selectedLocation.id
                        ? { ...l, name: e.target.value }
                        : l
                    ),
                  });
                }}
                style={inputStyle}
              />
            </Field>
            <Field label="População & Clima/Atmosfera">
              <textarea
                rows={2}
                value={`${selectedLocation.population ?? ''} — ${selectedLocation.climateOrAtmosphere}`}
                readOnly
                style={textareaStyle}
              />
            </Field>
            <Field label="Descrição Completa">
              <textarea
                rows={3}
                value={selectedLocation.description}
                onChange={(e) => {
                  if (!primaryWorld) return;
                  upsertWorld({
                    ...primaryWorld,
                    locations: primaryWorld.locations.map((l) =>
                      l.id === selectedLocation.id
                        ? { ...l, description: e.target.value }
                        : l
                    ),
                  });
                }}
                style={textareaStyle}
              />
            </Field>
            <Field label="Valor Estratégico & Controle">
              <textarea
                rows={3}
                value={selectedLocation.strategicValue}
                onChange={(e) => {
                  if (!primaryWorld) return;
                  upsertWorld({
                    ...primaryWorld,
                    locations: primaryWorld.locations.map((l) =>
                      l.id === selectedLocation.id
                        ? { ...l, strategicValue: e.target.value }
                        : l
                    ),
                  });
                }}
                style={textareaStyle}
              />
            </Field>
          </>
        )}

        {selectedSystem && (
          <>
            <Field label="Nome do Sistema & Subtipo">
              <input value={`${selectedSystem.name} (${selectedSystem.subtype})`} readOnly style={inputStyle} />
            </Field>
            <Field label="Fonte Primária">
              <textarea rows={2} value={selectedSystem.coreSource} readOnly style={textareaStyle} />
            </Field>
            <Field label="Leis Fundamentais">
              <textarea
                rows={4}
                value={selectedSystem.fundamentalRules.join('\n• ')}
                readOnly
                style={textareaStyle}
              />
            </Field>
            <Field label="Custo, Pedágio & Limites Absolutos">
              <textarea
                rows={3}
                value={`${selectedSystem.costsAndToll}\n\nLimites: ${selectedSystem.hardLimits.join('; ')}`}
                readOnly
                style={textareaStyle}
              />
            </Field>
          </>
        )}

        {selectedObject && (
          <>
            <Field label="Nome do Objeto">
              <input
                value={selectedObject.name}
                onChange={(e) =>
                  upsertObject({ ...selectedObject, name: e.target.value })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Descrição">
              <textarea
                rows={3}
                value={selectedObject.description}
                onChange={(e) =>
                  upsertObject({ ...selectedObject, description: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
            <Field label="Significado Narrativo & Regras">
              <textarea
                rows={3}
                value={selectedObject.significance}
                onChange={(e) =>
                  upsertObject({ ...selectedObject, significance: e.target.value })
                }
                style={textareaStyle}
              />
            </Field>
          </>
        )}

        {inspectorTab === 'relations' && (selectedChar || selectedFaction) && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f4f6', marginBottom: 8 }}>
              Vínculos Diretos ({(selectedChar?.relationships ?? selectedFaction?.relationships ?? []).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {(selectedChar?.relationships ?? selectedFaction?.relationships ?? []).map(
                (rel) => {
                  const targetName =
                    allEntities.find((e) => e.id === rel.targetId)?.name ??
                    rel.targetId;
                  return (
                    <div
                      key={rel.id}
                      style={{
                        padding: '9px 11px',
                        backgroundColor: '#151a26',
                        border: '1px solid #252d40',
                        borderRadius: 7,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f3f4f6' }}>
                          → {targetName}{' '}
                          <span
                            style={{
                              fontSize: 10.5,
                              color: REL_COLORS[rel.type] ?? '#9ca3af',
                              marginLeft: 4,
                            }}
                          >
                            [{rel.type} · Força {rel.strength}/10]
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
                          {rel.label}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRelationship(rel.id)}
                        title="Excluir vínculo"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                }
              )}
            </div>

            <div
              style={{
                padding: 12,
                backgroundColor: '#131824',
                border: '1px solid #262f45',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>
                + Adicionar Novo Vínculo no Grafo
              </div>
              <select
                value={newRelTargetId}
                onChange={(e) => setNewRelTargetId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecione a entidade de destino...</option>
                {allEntities
                  .filter((e) => e.id !== selectedNodeId)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      [{e.kind}] {e.name}
                    </option>
                  ))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select
                  value={newRelType}
                  onChange={(e) => setNewRelType(e.target.value as RelationshipType)}
                  style={inputStyle}
                >
                  <option value="ally">Aliado</option>
                  <option value="enemy">Inimigo</option>
                  <option value="rival">Rival</option>
                  <option value="mentor">Mentor</option>
                  <option value="family">Família</option>
                  <option value="romantic">Romântico</option>
                  <option value="vassal">Vassalo</option>
                  <option value="sovereign">Suserano</option>
                  <option value="war">Em Guerra</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newRelStrength}
                  onChange={(e) => setNewRelStrength(Number(e.target.value))}
                  placeholder="Força (1-10)"
                  style={inputStyle}
                />
              </div>
              <input
                value={newRelLabel}
                onChange={(e) => setNewRelLabel(e.target.value)}
                placeholder="Descrição do vínculo (ex.: Pacto de Sangue, Chantagem...)"
                style={inputStyle}
              />
              <button
                onClick={handleAddRelationship}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Plus size={14} /> Conectar no Grafo
              </button>
            </div>
          </div>
        )}

        {inspectorTab === 'epistemic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                color: '#fbbf24',
              }}
            >
              <Lock size={14} /> Segredos Epistêmicos & Conhecimento Restrito
            </div>
            {(selectedChar?.epistemicSecrets ?? selectedFaction?.epistemicSecrets ?? []).map(
              (sec) => (
                <div
                  key={sec.id}
                  style={{
                    padding: 12,
                    backgroundColor: '#151a26',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: '#f3f4f6', fontWeight: 600, marginBottom: 6 }}>
                    “{sec.secret}”
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    Conhecido por:{' '}
                    <strong style={{ color: '#34d399' }}>
                      {sec.knownByIds
                        .map((id) => allEntities.find((e) => e.id === id)?.name ?? id)
                        .join(', ')}
                    </strong>
                  </div>
                  {sec.revealedInSceneId && (
                    <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 3 }}>
                      Revelado na cena: {sec.revealedInSceneId}
                    </div>
                  )}
                </div>
              )
            )}
            {(selectedChar?.epistemicSecrets ?? selectedFaction?.epistemicSecrets ?? [])
              .length === 0 && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Nenhum segredo epistêmico restrito registrado para esta entidade.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: '#9ca3af',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '7px 10px',
  color: '#f3f4f6',
  fontSize: 12.5,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#e5e7eb',
  fontSize: 12,
  lineHeight: 1.45,
  resize: 'vertical',
};
