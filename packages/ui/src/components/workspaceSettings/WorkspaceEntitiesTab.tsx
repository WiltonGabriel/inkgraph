import { useMemo, useState } from 'react';
import { Boxes, Plus, Trash2, EyeOff } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  getEffectiveEntitySchemas,
  NATIVE_FIELD_OPTIONS,
} from '../../domain/registry';
import type { CustomFieldSchema, CustomFieldType, EntityTypeDefinition } from '../../types/project';
import { resolveEntityIcon } from '../common/entityIconResolver';
import {
  sectionCardStyle,
  innerCardStyle,
  sectionHeaderStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  controlInputStyle,
  secondaryButtonStyle,
  primaryButtonStyle,
  THEME_VAR,
} from '../settings/settingsStyles';

const ICON_OPTIONS = [
  'Box',
  'Users',
  'Shield',
  'MapPin',
  'Sparkles',
  'Package',
  'Zap',
  'Search',
  'Globe',
  'Feather',
];

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Lista de opções' },
  { value: 'boolean', label: 'Caixa Sim/Não' },
  { value: 'tags', label: 'Tags / Marcadores' },
  { value: 'entity_ref', label: 'Vínculo a outra entidade' },
];

export function WorkspaceEntitiesTab() {
  const { project, updateWorkspaceConfig, updateProject, requestConfirm, notify } = useProject();
  const schemas = useMemo(() => getEffectiveEntitySchemas(project), [project]);
  const schemaList = useMemo(() => Object.values(schemas), [schemas]);

  const [selectedId, setSelectedId] = useState<string>(schemaList[0]?.id ?? 'character');
  const [newTypeName, setNewTypeName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldIncludeMemory, setNewFieldIncludeMemory] = useState(true);

  const selected = schemas[selectedId] ?? schemaList[0];

  const updateSchema = (typeId: string, updater: (prev: EntityTypeDefinition) => EntityTypeDefinition) => {
    const base = schemas[typeId];
    if (!base) return;
    updateWorkspaceConfig((cfg) => ({
      ...cfg,
      entitySchemas: {
        ...cfg.entitySchemas,
        [typeId]: updater(cfg.entitySchemas[typeId] ?? base),
      },
    }));
  };

  const handleCreateCustomType = () => {
    const label = newTypeName.trim();
    if (!label) return;
    const slug =
      label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || `tipo_${Date.now()}`;
    if (schemas[slug]) {
      notify(`Já existe um tipo de entidade com identificador "${slug}".`, 'warning');
      return;
    }

    const created: EntityTypeDefinition = {
      id: slug,
      label,
      pluralLabel: `${label}s`,
      iconName: 'Box',
      color: '#06b6d4',
      isBuiltin: false,
      mentionPrefix: '@',
      hiddenNativeFields: [],
      customFields: [
        {
          key: 'status_detalhe',
          label: 'Detalhe Principal',
          type: 'text',
          includeInMemory: true,
        },
      ],
    };

    updateWorkspaceConfig((cfg) => ({
      ...cfg,
      entitySchemas: {
        ...cfg.entitySchemas,
        [slug]: created,
      },
    }));
    setSelectedId(slug);
    setNewTypeName('');
    notify(`Tipo de entidade "${label}" criado e exibido na barra lateral.`, 'success');
  };

  const handleDeleteCustomType = async (typeId: string) => {
    const schema = schemas[typeId];
    if (!schema || schema.isBuiltin) return;
    const ok = await requestConfirm({
      title: `Excluir Tipo "${schema.label}"`,
      message: 'Este tipo e suas fichas personalizadas vinculadas serão removidos deste workspace.',
      confirmLabel: 'Excluir Tipo',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;

    updateProject((prev) => {
      const nextSchemas = { ...(prev.workspaceConfig?.entitySchemas ?? {}) };
      delete nextSchemas[typeId];
      const nextCustomEntities = { ...(prev.customEntities ?? {}) };
      delete nextCustomEntities[typeId];
      return {
        ...prev,
        customEntities: nextCustomEntities,
        workspaceConfig: prev.workspaceConfig
          ? { ...prev.workspaceConfig, entitySchemas: nextSchemas }
          : undefined,
      };
    });
    setSelectedId('character');
    notify(`Tipo "${schema.label}" removido.`, 'info');
  };

  const handleAddCustomField = () => {
    if (!selected || !newFieldLabel.trim()) return;
    const key =
      newFieldLabel
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || `campo_${Date.now()}`;

    if (selected.customFields.some((f) => f.key === key)) {
      notify(`Já existe um campo com chave "${key}".`, 'warning');
      return;
    }

    const field: CustomFieldSchema = {
      key,
      label: newFieldLabel.trim(),
      type: newFieldType,
      options:
        newFieldType === 'select'
          ? newFieldOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      includeInMemory: newFieldIncludeMemory,
      completenessWeight: 3,
    };

    updateSchema(selected.id, (prev) => ({
      ...prev,
      customFields: [...prev.customFields, field],
    }));
    setNewFieldLabel('');
    setNewFieldOptions('');
    notify(`Campo "${field.label}" adicionado em ${selected.label}.`, 'success');
  };

  const nativeOptions = selected ? (NATIVE_FIELD_OPTIONS[selected.id] ?? []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section style={sectionCardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={sectionHeaderStyle}>
            <Boxes size={16} style={{ color: THEME_VAR.accentPrimary }} />
            Objetos & Entidades do Domínio
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Novo tipo (ex: Nave, Feitiço, Pista)..."
              style={{ ...controlInputStyle, width: 220 }}
            />
            <button type="button" onClick={handleCreateCustomType} style={primaryButtonStyle}>
              <Plus size={14} /> Novo Tipo
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: '0.9rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {schemaList.map((item) => {
              const Icon = resolveEntityIcon(item.iconName);
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: THEME_VAR.radiusSm,
                    border: `1px solid ${isSelected ? THEME_VAR.accentPrimary : THEME_VAR.borderSubtle}`,
                    background: isSelected ? THEME_VAR.accentSoft : THEME_VAR.bgElevated,
                    color: THEME_VAR.textPrimary,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon size={14} style={{ color: item.color }} />
                    <span>{item.pluralLabel}</span>
                  </span>
                  <span style={{ fontSize: 10, color: THEME_VAR.textMuted }}>
                    {item.customFields.length > 0 ? `+${item.customFields.length}` : item.isBuiltin ? 'Base' : 'Custom'}
                  </span>
                </button>
              );
            })}
          </div>

          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  ...innerCardStyle,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.7rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: THEME_VAR.textPrimary }}>
                    Esquema: {selected.label} ({selected.id})
                  </span>
                  {!selected.isBuiltin && !selected.sourcePluginId && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteCustomType(selected.id)}
                      style={{ ...secondaryButtonStyle, color: '#ef4444' }}
                    >
                      <Trash2 size={13} /> Excluir Tipo
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.65rem',
                  }}
                >
                  <label style={fieldColumnStyle}>
                    <span style={fieldLabelTextStyle}>Rótulo Singular</span>
                    <input
                      value={selected.label}
                      onChange={(e) =>
                        updateSchema(selected.id, (prev) => ({ ...prev, label: e.target.value }))
                      }
                      style={controlInputStyle}
                    />
                  </label>
                  <label style={fieldColumnStyle}>
                    <span style={fieldLabelTextStyle}>Rótulo Plural (Barra Lateral)</span>
                    <input
                      value={selected.pluralLabel}
                      onChange={(e) =>
                        updateSchema(selected.id, (prev) => ({ ...prev, pluralLabel: e.target.value }))
                      }
                      style={controlInputStyle}
                    />
                  </label>
                  <label style={fieldColumnStyle}>
                    <span style={fieldLabelTextStyle}>Ícone</span>
                    <select
                      value={selected.iconName}
                      onChange={(e) =>
                        updateSchema(selected.id, (prev) => ({ ...prev, iconName: e.target.value }))
                      }
                      style={controlInputStyle}
                    >
                      {ICON_OPTIONS.map((ic) => (
                        <option key={ic} value={ic}>
                          {ic}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={fieldColumnStyle}>
                    <span style={fieldLabelTextStyle}>Cor no Grafo & Barra</span>
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) =>
                        updateSchema(selected.id, (prev) => ({ ...prev, color: e.target.value }))
                      }
                      style={{ width: 42, height: 32, border: 'none', background: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {nativeOptions.length > 0 && (
                <div style={innerCardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: THEME_VAR.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    <EyeOff size={13} />
                    Campos Nativos Visíveis no Estúdio (desmarque para simplificar a ficha)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {nativeOptions.map((opt) => {
                      const isVisible = !selected.hiddenNativeFields.includes(opt.key);
                      return (
                        <label
                          key={opt.key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 9px',
                            borderRadius: 999,
                            backgroundColor: isVisible ? THEME_VAR.accentSoft : THEME_VAR.bgSurface,
                            border: `1px solid ${THEME_VAR.borderSubtle}`,
                            fontSize: 11.5,
                            color: THEME_VAR.textPrimary,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() =>
                              updateSchema(selected.id, (prev) => ({
                                ...prev,
                                hiddenNativeFields: isVisible
                                  ? [...prev.hiddenNativeFields, opt.key]
                                  : prev.hiddenNativeFields.filter((k) => k !== opt.key),
                              }))
                            }
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ ...innerCardStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME_VAR.textPrimary }}>
                  Campos Customizados ({selected.customFields.length})
                </div>

                {selected.customFields.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: THEME_VAR.radiusSm,
                      backgroundColor: THEME_VAR.bgSurface,
                      border: `1px solid ${THEME_VAR.borderSubtle}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME_VAR.textPrimary }}>
                        {field.label}{' '}
                        <code style={{ fontSize: 11, color: THEME_VAR.textMuted }}>({field.key})</code>
                      </div>
                      <div style={{ fontSize: 11, color: THEME_VAR.textSecondary }}>
                        Tipo: {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
                        {field.includeInMemory ? ' · Indexado no AI Memory' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSchema(selected.id, (prev) => ({
                          ...prev,
                          customFields: prev.customFields.filter((f) => f.key !== field.key),
                        }))
                      }
                      style={{ ...secondaryButtonStyle, color: '#ef4444', padding: '4px 8px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px auto',
                    gap: 8,
                    alignItems: 'end',
                    paddingTop: 6,
                    borderTop: `1px solid ${THEME_VAR.borderSubtle}`,
                  }}
                >
                  <label style={fieldColumnStyle}>
                    <span style={fieldLabelTextStyle}>Novo Campo</span>
                    <input
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Ex: Nível de Ameaça, Linhagem..."
                      style={controlInputStyle}
                    />
                  </label>
                  <label style={fieldColumnStyle}>
                    <span style={fieldLabelTextStyle}>Tipo do Campo</span>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                      style={controlInputStyle}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>
                          {ft.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={handleAddCustomField} style={primaryButtonStyle}>
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                {newFieldType === 'select' && (
                  <input
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="Opções separadas por vírgula (ex: Baixo, Médio, Crítico)"
                    style={controlInputStyle}
                  />
                )}

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11.5,
                    color: THEME_VAR.textSecondary,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newFieldIncludeMemory}
                    onChange={(e) => setNewFieldIncludeMemory(e.target.checked)}
                  />
                  Incluir este campo automaticamente no compilador AI Memory e Radar de Cânone
                </label>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
