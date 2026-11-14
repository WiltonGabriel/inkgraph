import { useState } from 'react';
import { Link2, Lock, Plus, Trash2 } from 'lucide-react';
import { listUnifiedEntities } from '../../domain/registry';
import type {
  EntityRelationship,
  EpistemicSecret,
  ProjectData,
  RelationshipType,
} from '../../types/project';
import { REL_LABELS_PT } from '../graph/graphDataBuilder';
import { THEME_VAR } from '../settings/settingsStyles';

interface EntityMetaConnectionsPanelProps {
  project: ProjectData;
  currentEntityId: string;
  relationships: EntityRelationship[];
  epistemicSecrets: EpistemicSecret[];
  onChangeRelationships: (next: EntityRelationship[]) => void;
  onChangeSecrets: (next: EpistemicSecret[]) => void;
}

export function EntityMetaConnectionsPanel({
  project,
  currentEntityId,
  relationships,
  epistemicSecrets,
  onChangeRelationships,
  onChangeSecrets,
}: EntityMetaConnectionsPanelProps) {
  const allTargets = listUnifiedEntities(project).filter((e) => e.id !== currentEntityId);
  const targetNameById = new Map(allTargets.map((e) => [e.id, `${e.name} (${e.typeLabel})`]));

  const [targetId, setTargetId] = useState(allTargets[0]?.id ?? '');
  const [relType, setRelType] = useState<RelationshipType>('ally');
  const [relLabel, setRelLabel] = useState('');
  const [secretText, setSecretText] = useState('');

  const effectiveTargetId = allTargets.some((t) => t.id === targetId)
    ? targetId
    : (allTargets[0]?.id ?? '');

  const handleAddRelation = () => {
    if (!effectiveTargetId) return;
    const rel: EntityRelationship = {
      id: `rel_${Date.now()}`,
      targetId: effectiveTargetId,
      targetKind: 'character',
      type: relType,
      label: relLabel.trim() || REL_LABELS_PT[relType],
      strength: 7,
      sentiment: relType === 'enemy' || relType === 'war' || relType === 'rival' ? -0.6 : 0.6,
    };
    onChangeRelationships([...relationships, rel]);
    setRelLabel('');
  };

  const handleAddSecret = () => {
    const secret = secretText.trim();
    if (!secret) return;
    onChangeSecrets([
      ...epistemicSecrets,
      {
        id: `sec_${Date.now()}`,
        secret,
        knownByIds: [currentEntityId],
      },
    ]);
    setSecretText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          padding: 12,
          borderRadius: THEME_VAR.radiusSm,
          backgroundColor: THEME_VAR.bgSurface,
          border: `1px solid ${THEME_VAR.borderSubtle}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: THEME_VAR.textPrimary,
          }}
        >
          <Link2 size={14} style={{ color: THEME_VAR.accentPrimary }} />
          Relações no Grafo & Narrativa ({relationships.length})
        </div>

        {relationships.map((rel) => (
          <div
            key={rel.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '6px 9px',
              borderRadius: THEME_VAR.radiusSm,
              backgroundColor: THEME_VAR.bgElevated,
              border: `1px solid ${THEME_VAR.borderSubtle}`,
              fontSize: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <span style={{ fontWeight: 600, color: THEME_VAR.textPrimary }}>
                {targetNameById.get(rel.targetId) ?? rel.targetId}
              </span>
              <span style={{ color: THEME_VAR.accentPrimary, marginLeft: 6 }}>
                [{REL_LABELS_PT[rel.type] ?? rel.type}]
              </span>
              {rel.label && (
                <span style={{ color: THEME_VAR.textSecondary, marginLeft: 6 }}>· {rel.label}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onChangeRelationships(relationships.filter((r) => r.id !== rel.id))}
              aria-label="Remover relação"
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {allTargets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr auto', gap: 6 }}>
            <select
              value={effectiveTargetId}
              onChange={(e) => setTargetId(e.target.value)}
              style={{
                padding: '6px 8px',
                backgroundColor: THEME_VAR.bgElevated,
                border: `1px solid ${THEME_VAR.borderSubtle}`,
                borderRadius: THEME_VAR.radiusSm,
                color: THEME_VAR.textPrimary,
                fontSize: 12,
              }}
            >
              {allTargets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.typeLabel})
                </option>
              ))}
            </select>

            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value as RelationshipType)}
              style={{
                padding: '6px 8px',
                backgroundColor: THEME_VAR.bgElevated,
                border: `1px solid ${THEME_VAR.borderSubtle}`,
                borderRadius: THEME_VAR.radiusSm,
                color: THEME_VAR.textPrimary,
                fontSize: 12,
              }}
            >
              {Object.entries(REL_LABELS_PT).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <input
              value={relLabel}
              onChange={(e) => setRelLabel(e.target.value)}
              placeholder="Descrição do vínculo (ex: Portador, Requer...)..."
              style={{
                padding: '6px 8px',
                backgroundColor: THEME_VAR.bgElevated,
                border: `1px solid ${THEME_VAR.borderSubtle}`,
                borderRadius: THEME_VAR.radiusSm,
                color: THEME_VAR.textPrimary,
                fontSize: 12,
              }}
            />

            <button
              type="button"
              onClick={handleAddRelation}
              style={{
                padding: '6px 10px',
                backgroundColor: THEME_VAR.accentPrimary,
                color: '#ffffff',
                border: 'none',
                borderRadius: THEME_VAR.radiusSm,
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Vincular
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: THEME_VAR.radiusSm,
          backgroundColor: THEME_VAR.bgSurface,
          border: `1px solid ${THEME_VAR.borderSubtle}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: '#f59e0b',
          }}
        >
          <Lock size={14} />
          Segredos Epistêmicos ({epistemicSecrets.length})
        </div>

        {epistemicSecrets.map((sec) => (
          <div
            key={sec.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '6px 9px',
              borderRadius: THEME_VAR.radiusSm,
              backgroundColor: THEME_VAR.bgElevated,
              border: '1px solid rgba(245,158,11,0.35)',
              fontSize: 12,
              color: THEME_VAR.textPrimary,
            }}
          >
            <span>{sec.secret}</span>
            <button
              type="button"
              onClick={() => onChangeSecrets(epistemicSecrets.filter((s) => s.id !== sec.id))}
              aria-label="Remover segredo"
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={secretText}
            onChange={(e) => setSecretText(e.target.value)}
            placeholder="Novo fato oculto ou restrição epistêmica ligada a esta entidade..."
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: THEME_VAR.bgElevated,
              border: `1px solid ${THEME_VAR.borderSubtle}`,
              borderRadius: THEME_VAR.radiusSm,
              color: THEME_VAR.textPrimary,
              fontSize: 12,
            }}
          />
          <button
            type="button"
            onClick={handleAddSecret}
            style={{
              padding: '6px 10px',
              backgroundColor: '#f59e0b',
              color: '#111827',
              border: 'none',
              borderRadius: THEME_VAR.radiusSm,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Segredo
          </button>
        </div>
      </div>
    </div>
  );
}
