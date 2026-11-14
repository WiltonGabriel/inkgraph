import { useState, type CSSProperties } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EntityRelationship, RelationshipType } from '../../types/project';
import { REL_COLORS, REL_LABELS_PT, type GraphNode } from './graphDataBuilder';

interface GraphInspectorRelationsProps {
  entityId: string;
  relationships: EntityRelationship[];
  allEntities: GraphNode[];
  onUpdateRelationships: (next: EntityRelationship[]) => void;
  onSelectNode: (id: string) => void;
}

const RELATIONSHIP_TYPE_OPTIONS = Object.entries(REL_LABELS_PT) as [
  RelationshipType,
  string,
][];

export function GraphInspectorRelations({
  entityId,
  relationships,
  allEntities,
  onUpdateRelationships,
  onSelectNode,
}: GraphInspectorRelationsProps) {
  const [targetId, setTargetId] = useState<string>('');
  const [relType, setRelType] = useState<RelationshipType>('ally');
  const [label, setLabel] = useState<string>('');
  const [strength, setStrength] = useState<number>(7);

  const handleAdd = () => {
    if (!targetId || !label.trim()) return;
    const targetNode = allEntities.find((e) => e.id === targetId);
    if (!targetNode) return;

    const clampedStrength = Math.max(1, Math.min(10, Math.round(strength || 5)));
    const isHostile = relType === 'enemy' || relType === 'war' || relType === 'rival';

    const nextRel: EntityRelationship = {
      id: `rel_${Date.now()}`,
      targetId: targetNode.id,
      targetKind: targetNode.kind,
      type: relType,
      label: label.trim(),
      strength: clampedStrength,
      sentiment: isHostile ? -0.8 : 0.7,
    };

    onUpdateRelationships([...relationships, nextRel]);
    setLabel('');
  };

  const handleDelete = (relId: string) => {
    onUpdateRelationships(relationships.filter((r) => r.id !== relId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Vínculos Diretos ({relationships.length})
        </div>

        {relationships.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Nenhum vínculo personalizado registrado para esta entidade.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relationships.map((rel) => {
              const targetName =
                allEntities.find((e) => e.id === rel.targetId)?.name ?? rel.targetId;
              const dotColor = REL_COLORS[rel.type] ?? 'var(--text-muted)';
              return (
                <div
                  key={rel.id}
                  style={{
                    padding: '9px 11px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectNode(rel.targetId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        → {targetName}
                      </button>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: dotColor,
                          }}
                        />
                        {REL_LABELS_PT[rel.type] ?? rel.type} · {rel.strength}/10
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-secondary)',
                        marginTop: 3,
                      }}
                    >
                      {rel.label}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(rel.id)}
                    aria-label={`Excluir vínculo com ${targetName}`}
                    title="Excluir vínculo"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger, #ef4444)',
                      cursor: 'pointer',
                      minWidth: 24,
                      minHeight: 24,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 12,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>
          + Adicionar Novo Vínculo no Grafo
        </div>
        <select
          aria-label="Entidade de destino"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          style={controlStyle}
        >
          <option value="">Selecione a entidade de destino...</option>
          {allEntities
            .filter((e) => e.id !== entityId)
            .map((e) => (
              <option key={e.id} value={e.id}>
                [{e.kind}] {e.name}
              </option>
            ))}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select
            aria-label="Tipo de vínculo"
            value={relType}
            onChange={(e) => setRelType(e.target.value as RelationshipType)}
            style={controlStyle}
          >
            {RELATIONSHIP_TYPE_OPTIONS.map(([val, text]) => (
              <option key={val} value={val}>
                {text}
              </option>
            ))}
          </select>
          <input
            aria-label="Força do vínculo (1 a 10)"
            type="number"
            min={1}
            max={10}
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            placeholder="Força (1-10)"
            style={controlStyle}
          />
        </div>

        <input
          aria-label="Descrição do vínculo"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Descrição do vínculo (ex.: Pacto de Sangue, Rota Comercial...)"
          style={controlStyle}
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={!targetId || !label.trim()}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 12,
            fontWeight: 600,
            cursor: !targetId || !label.trim() ? 'not-allowed' : 'pointer',
            opacity: !targetId || !label.trim() ? 0.55 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Conectar no Grafo
        </button>
      </div>
    </div>
  );
}

const controlStyle: CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '7px 10px',
  color: 'var(--text-primary)',
  fontSize: 12.5,
};
