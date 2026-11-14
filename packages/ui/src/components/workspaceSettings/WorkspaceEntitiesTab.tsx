import { useMemo, useState } from 'react';
import { Boxes, Plus, Trash2, EyeOff, RotateCcw, Asterisk } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  getEffectiveEntitySchemas,
  getPluginProvidedFieldKeys,
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
import { CUSTOM_FIELD_TYPES, CustomFieldEditorRow } from './CustomFieldEditorRow';

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

export function WorkspaceEntitiesTab() {
  const { project, updateWorkspaceConfig, updateProject, requestConfirm, notify } = useProject();
  const schemas = useMemo(() => getEffectiveEntitySchemas(project), [project]);
  const schemaList = useMemo(() => Object.values(schemas), [schemas]);

  const [selectedId, setSelectedId] = useState<string>(schemaList[0]?.id ?? 'character');
  const [newTypeName, setNewTypeName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldTargetType, setNewFieldTargetType] = useState('character');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldIncludeMemory, setNewFieldIncludeMemory] = useState(true);

  const selected = schemas[selectedId] ?? schemaList[0];
  const pluginFieldKeys = useMemo(
    () => (selected ? getPluginProvidedFieldKeys(project, selected.id) : new Set<string>()),
    [project, selected]
  );

  const updateSchema = (typeId: string, updater: (prev: EntityTypeDefinition) => EntityTypeDefinition) => {
    const base = schemas[typeId];
    if (!base) return;
    updateWorkspaceConfig((cfg) => {
      const existing = cfg.entitySchemas[typeId];
      const seed: EntityTypeDefinition = existing
        ? {
            ...base,
            ...existing,
            hiddenNativeFields: [...(existing.hiddenNativeFields ?? base.hiddenNativeFields)],
            hiddenCustomFields: [...(existing.hiddenCustomFields ?? base.hiddenCustomFields ?? [])],
            requiredNativeFields: [...(existing.requiredNativeFields ?? base.requiredNativeFields ?? [])],
            customFields:
              existing.customFields.length > 0 || base.customFields.length === 0
                ? existing.customFields
                : [...base.customFields],
          }
        : {
            ...base,
            hiddenNativeFields: [...base.hiddenNativeFields],
            hiddenCustomFields: [...(base.hiddenCustomFields ?? [])],
            requiredNativeFields: [...(base.requiredNativeFields ?? [])],
            customFields: [...base.customFields],
          };

      return {
        ...cfg,
        entitySchemas: {
          ...cfg.entitySchemas,
          [typeId]: updater(seed),
        },
      };
    });
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
      required: newFieldRequired,
      options:
        newFieldType === 'select'
          ? newFieldOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      targetEntityType: newFieldType === 'entity_ref' ? newFieldTargetType : undefined,
      includeInMemory: newFieldIncludeMemory,
      completenessWeight: newFieldRequired ? 5 : 3,
    };

    updateSchema(selected.id, (prev) => ({
      ...prev,
      hiddenCustomFields: (prev.hiddenCustomFields ?? []).filter((k) => k !== key),
      customFields: [...prev.customFields.filter((f) => f.key !== key), field],
    }));
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldRequired(false);
    notify(`Campo "${field.label}" adicionado em ${selected.label}.`, 'success');
  };

  const handleSaveCustomField = (updated: CustomFieldSchema) => {
    if (!selected) return;
    updateSchema(selected.id, (prev) => {
      const exists = prev.customFields.some((f) => f.key === updated.key);
      return {
        ...prev,
        customFields: exists
          ? prev.customFields.map((f) => (f.key === updated.key ? updated : f))
          : [...prev.customFields, updated],
      };
    });
    notify(`Campo "${updated.label}" atualizado em ${selected.label}.`, 'success');
  };

  const handleRemoveOrHideCustomField = (fieldKey: string) => {
    if (!selected) return;
    const isPluginField = pluginFieldKeys.has(fieldKey);
    updateSchema(selected.id, (prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f.key !== fieldKey),
      hiddenCustomFields: isPluginField
        ? Array.from(new Set([...(prev.hiddenCustomFields ?? []), fieldKey]))
        : prev.hiddenCustomFields,
    }));
    notify(
      isPluginField
        ? 'Campo de plugin ocultado neste workspace (pode ser restaurado a qualquer momento).'
        : 'Campo removido do esquema.',
      'info'
    );
  };

  const handleRestorePluginFields = () => {
    if (!selected) return;
    updateSchema(selected.id, (prev) => ({
      ...prev,
      hiddenCustomFields: [],
    }));
    notify(`Campos padrão de plugin restaurados em ${selected.label}.`, 'success');
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
                    Campos Nativos: Visibilidade e Obrigatoriedade
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {nativeOptions.map((opt) => {
                      const isVisible = !selected.hiddenNativeFields.includes(opt.key);
                      const isRequired = (selected.requiredNativeFields ?? []).includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 999,
                            backgroundColor: isVisible ? THEME_VAR.accentSoft : THEME_VAR.bgSurface,
                            border: `1px solid ${THEME_VAR.borderSubtle}`,
                            fontSize: 11.5,
                            color: THEME_VAR.textPrimary,
                          }}
                        >
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
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
                                  requiredNativeFields: isVisible
                                    ? (prev.requiredNativeFields ?? []).filter((k) => k !== opt.key)
                                    : prev.requiredNativeFields,
                                }))
                              }
                            />
                            {opt.label}
                          </label>
                          {isVisible && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSchema(selected.id, (prev) => ({
                                  ...prev,
                                  requiredNativeFields: isRequired
                                    ? (prev.requiredNativeFields ?? []).filter((k) => k !== opt.key)
                                    : [...(prev.requiredNativeFields ?? []), opt.key],
                                }))
                              }
                              title={
                                isRequired
                                  ? 'Campo obrigatório (clique para tornar opcional)'
                                  : 'Campo opcional (clique para exigir preenchimento)'
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                padding: '1px 6px',
                                borderRadius: 999,
                                border: `1px solid ${isRequired ? THEME_VAR.accentPrimary : THEME_VAR.borderSubtle}`,
                                backgroundColor: isRequired ? THEME_VAR.accentPrimary : 'transparent',
                                color: isRequired ? '#ffffff' : THEME_VAR.textMuted,
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Asterisk size={9} />
                              {isRequired ? 'Obrig.' : 'Opc.'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ ...innerCardStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME_VAR.textPrimary }}>
                    Campos Customizados & Extensões ({selected.customFields.length})
                  </div>
                  {(selected.hiddenCustomFields?.length ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={handleRestorePluginFields}
                      style={{ ...secondaryButtonStyle, fontSize: 11, padding: '3px 9px' }}
                    >
                      <RotateCcw size={12} /> Restaurar {selected.hiddenCustomFields?.length} oculto(s)
                    </button>
                  )}
                </div>

                {selected.customFields.map((field) => (
                  <CustomFieldEditorRow
                    key={field.key}
                    field={field}
                    isPluginProvided={pluginFieldKeys.has(field.key)}
                    allEntityTypes={schemaList}
                    onSave={handleSaveCustomField}
                    onRemove={() => handleRemoveOrHideCustomField(field.key)}
                  />
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
                      {CUSTOM_FIELD_TYPES.map((ft) => (
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

                {newFieldType === 'entity_ref' && (
                  <label style={fieldColumnStyle}>
                    <span style={fieldLabelTextStyle}>Entidade Vinculada</span>
                    <select
                      value={newFieldTargetType}
                      onChange={(e) => setNewFieldTargetType(e.target.value)}
                      style={controlInputStyle}
                    >
                      {schemaList.map((et) => (
                        <option key={et.id} value={et.id}>
                          {et.label} ({et.id})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11.5,
                      color: THEME_VAR.textSecondary,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                    />
                    Exigir preenchimento (obrigatório)
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11.5,
                      color: THEME_VAR.textSecondary,
                      cursor: 'pointer',
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
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
