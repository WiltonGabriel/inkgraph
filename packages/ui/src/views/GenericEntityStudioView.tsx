import { useMemo, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { getEntitySchema, listCustomEntitySchemas } from '../domain/registry';
import {
  calculateGenericEntityCompleteness,
  type CanonStatus,
  type GenericEntityRecord,
} from '../types/project';
import { DynamicFieldRenderer } from '../components/common/DynamicFieldRenderer';
import { EntityMetaConnectionsPanel } from '../components/common/EntityMetaConnectionsPanel';
import { CompletenessRing } from '../components/ui/CompletenessRing';
import { resolveEntityIcon } from '../components/common/entityIconResolver';
import { THEME_VAR } from '../components/settings/settingsStyles';

export function GenericEntityStudioView() {
  const {
    project,
    activeCustomEntityTypeId,
    setActiveCustomEntityTypeId,
    upsertCustomEntity,
    deleteCustomEntity,
    requestConfirm,
    notify,
    setActiveView,
  } = useProject();

  const customSchemas = useMemo(() => listCustomEntitySchemas(project), [project]);
  const currentTypeId =
    activeCustomEntityTypeId && getEntitySchema(project, activeCustomEntityTypeId)
      ? activeCustomEntityTypeId
      : (customSchemas[0]?.id ?? '');
  const schema = currentTypeId ? getEntitySchema(project, currentTypeId) : undefined;

  const records = useMemo(
    () => (currentTypeId ? project.customEntities?.[currentTypeId] ?? [] : []),
    [project.customEntities, currentTypeId]
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [records, search]);

  const activeRecord =
    records.find((r) => r.id === selectedId) ?? filtered[0] ?? records[0] ?? null;

  if (!schema) {
    return (
      <div style={{ padding: '2rem', color: THEME_VAR.textSecondary }}>
        Nenhum tipo de entidade personalizado ativo. Crie um em{' '}
        <button
          type="button"
          onClick={() => setActiveView('workspace-settings')}
          style={{
            background: 'none',
            border: 'none',
            color: THEME_VAR.accentPrimary,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Configurações do Workspace
        </button>
        .
      </div>
    );
  }

  const Icon = resolveEntityIcon(schema.iconName);

  const handleCreate = () => {
    const created: GenericEntityRecord = {
      id: `ent_${schema.id}_${Date.now()}`,
      entityTypeId: schema.id,
      name: `Novo ${schema.label}`,
      aliases: [],
      status: 'draft',
      summary: '',
      notes: '',
      tags: [],
      customAttributes: {},
      relationships: [],
      epistemicSecrets: [],
      updatedAt: new Date().toISOString(),
    };
    upsertCustomEntity(created);
    setSelectedId(created.id);
    notify(`${schema.label} criado.`, 'success');
  };

  const handleDelete = async (record: GenericEntityRecord) => {
    const ok = await requestConfirm({
      title: `Excluir "${record.name}"`,
      message: `Tem certeza que deseja excluir este registro de ${schema.label}?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;
    deleteCustomEntity(schema.id, record.id);
    notify(`"${record.name}" removido.`, 'info');
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: THEME_VAR.bgCanvas }}>
      <aside
        style={{
          width: 280,
          borderRight: `1px solid ${THEME_VAR.borderSubtle}`,
          backgroundColor: THEME_VAR.bgSurface,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 14px 10px',
            borderBottom: `1px solid ${THEME_VAR.borderSubtle}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13.5,
                fontWeight: 700,
                color: THEME_VAR.textPrimary,
              }}
            >
              <Icon size={16} style={{ color: schema.color }} />
              {schema.pluralLabel}
            </span>
            <button
              type="button"
              onClick={handleCreate}
              style={{
                padding: '5px 9px',
                borderRadius: THEME_VAR.radiusSm,
                backgroundColor: THEME_VAR.accentPrimary,
                color: '#ffffff',
                fontSize: 11.5,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={13} /> Novo
            </button>
          </div>

          {customSchemas.length > 1 && (
            <select
              value={schema.id}
              onChange={(e) => {
                setActiveCustomEntityTypeId(e.target.value);
                setSelectedId('');
              }}
              style={{
                width: '100%',
                padding: '5px 8px',
                fontSize: 12,
                backgroundColor: THEME_VAR.bgElevated,
                border: `1px solid ${THEME_VAR.borderSubtle}`,
                borderRadius: THEME_VAR.radiusSm,
                color: THEME_VAR.textPrimary,
              }}
            >
              {customSchemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.pluralLabel}
                </option>
              ))}
            </select>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 8px',
              borderRadius: THEME_VAR.radiusSm,
              backgroundColor: THEME_VAR.bgElevated,
              border: `1px solid ${THEME_VAR.borderSubtle}`,
            }}
          >
            <Search size={13} style={{ color: THEME_VAR.textMuted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filtrar ${schema.pluralLabel.toLowerCase()}...`}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: THEME_VAR.textPrimary,
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 14, fontSize: 12, color: THEME_VAR.textMuted, textAlign: 'center' }}>
              Nenhum registro ainda.
            </div>
          ) : (
            filtered.map((rec) => {
              const isSelected = activeRecord?.id === rec.id;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedId(rec.id)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 10px',
                    borderRadius: THEME_VAR.radiusSm,
                    border: `1px solid ${isSelected ? schema.color : 'transparent'}`,
                    backgroundColor: isSelected ? THEME_VAR.accentSoft : 'transparent',
                    color: THEME_VAR.textPrimary,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{rec.name}</div>
                  <div style={{ fontSize: 11, color: THEME_VAR.textSecondary, marginTop: 2 }}>
                    {rec.status} {rec.summary ? `· ${rec.summary.slice(0, 42)}` : ''}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        {!activeRecord ? (
          <div style={{ color: THEME_VAR.textMuted, fontSize: 13 }}>
            Crie ou selecione um registro de {schema.label} à esquerda.
          </div>
        ) : (
          <div style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <CompletenessRing
                percent={calculateGenericEntityCompleteness(activeRecord, schema)}
                size={40}
                strokeWidth={4}
              />
              <input
                value={activeRecord.name}
                onChange={(e) =>
                  upsertCustomEntity({
                    ...activeRecord,
                    name: e.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                style={{
                  flex: 1,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${THEME_VAR.borderSubtle}`,
                  color: THEME_VAR.textPrimary,
                  padding: '4px 0',
                }}
              />
              <select
                value={activeRecord.status}
                onChange={(e) =>
                  upsertCustomEntity({
                    ...activeRecord,
                    status: e.target.value as CanonStatus,
                    updatedAt: new Date().toISOString(),
                  })
                }
                style={{
                  padding: '6px 10px',
                  backgroundColor: THEME_VAR.bgElevated,
                  border: `1px solid ${THEME_VAR.borderSubtle}`,
                  borderRadius: THEME_VAR.radiusSm,
                  color: THEME_VAR.textPrimary,
                  fontSize: 12,
                }}
              >
                <option value="canon">Cânone</option>
                <option value="provisional">Provisório</option>
                <option value="draft">Rascunho</option>
              </select>
              <button
                type="button"
                onClick={() => void handleDelete(activeRecord)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: THEME_VAR.bgElevated,
                  border: `1px solid ${THEME_VAR.borderSubtle}`,
                  borderRadius: THEME_VAR.radiusSm,
                  color: '#ef4444',
                  fontSize: 12,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11.5, color: THEME_VAR.textSecondary, fontWeight: 600 }}>
                  Aliases / Codinomes (separados por vírgula)
                </span>
                <input
                  value={activeRecord.aliases.join(', ')}
                  onChange={(e) =>
                    upsertCustomEntity({
                      ...activeRecord,
                      aliases: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  style={{
                    padding: '6px 9px',
                    backgroundColor: THEME_VAR.bgElevated,
                    border: `1px solid ${THEME_VAR.borderSubtle}`,
                    borderRadius: THEME_VAR.radiusSm,
                    color: THEME_VAR.textPrimary,
                    fontSize: 12.5,
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11.5, color: THEME_VAR.textSecondary, fontWeight: 600 }}>
                  Tags (separadas por vírgula)
                </span>
                <input
                  value={activeRecord.tags.join(', ')}
                  onChange={(e) =>
                    upsertCustomEntity({
                      ...activeRecord,
                      tags: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  style={{
                    padding: '6px 9px',
                    backgroundColor: THEME_VAR.bgElevated,
                    border: `1px solid ${THEME_VAR.borderSubtle}`,
                    borderRadius: THEME_VAR.radiusSm,
                    color: THEME_VAR.textPrimary,
                    fontSize: 12.5,
                  }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: THEME_VAR.textSecondary, fontWeight: 600 }}>
                Resumo Canônico
              </span>
              <textarea
                rows={2}
                value={activeRecord.summary}
                onChange={(e) =>
                  upsertCustomEntity({
                    ...activeRecord,
                    summary: e.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                style={{
                  padding: '7px 9px',
                  backgroundColor: THEME_VAR.bgElevated,
                  border: `1px solid ${THEME_VAR.borderSubtle}`,
                  borderRadius: THEME_VAR.radiusSm,
                  color: THEME_VAR.textPrimary,
                  fontSize: 12.5,
                }}
              />
            </label>

            <DynamicFieldRenderer
              title={`Campos de ${schema.label}`}
              fields={schema.customFields}
              values={activeRecord.customAttributes}
              onChange={(nextAttrs) =>
                upsertCustomEntity({
                  ...activeRecord,
                  customAttributes: nextAttrs,
                  updatedAt: new Date().toISOString(),
                })
              }
            />

            <EntityMetaConnectionsPanel
              project={project}
              currentEntityId={activeRecord.id}
              relationships={activeRecord.relationships}
              epistemicSecrets={activeRecord.epistemicSecrets}
              onChangeRelationships={(nextRels) =>
                upsertCustomEntity({
                  ...activeRecord,
                  relationships: nextRels,
                  updatedAt: new Date().toISOString(),
                })
              }
              onChangeSecrets={(nextSecrets) =>
                upsertCustomEntity({
                  ...activeRecord,
                  epistemicSecrets: nextSecrets,
                  updatedAt: new Date().toISOString(),
                })
              }
            />

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: THEME_VAR.textSecondary, fontWeight: 600 }}>
                Notas & Detalhes Livres
              </span>
              <textarea
                rows={5}
                value={activeRecord.notes}
                onChange={(e) =>
                  upsertCustomEntity({
                    ...activeRecord,
                    notes: e.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                style={{
                  padding: '8px 10px',
                  backgroundColor: THEME_VAR.bgElevated,
                  border: `1px solid ${THEME_VAR.borderSubtle}`,
                  borderRadius: THEME_VAR.radiusSm,
                  color: THEME_VAR.textPrimary,
                  fontSize: 12.5,
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
