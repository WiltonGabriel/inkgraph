import { useState } from 'react';
import { Pencil, Trash2, EyeOff, Check, X } from 'lucide-react';
import type { CustomFieldSchema, CustomFieldType, EntityTypeDefinition } from '../../types/project';
import {
  fieldColumnStyle,
  fieldLabelTextStyle,
  controlInputStyle,
  secondaryButtonStyle,
  primaryButtonStyle,
  THEME_VAR,
} from '../settings/settingsStyles';

export const CUSTOM_FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Lista de opções' },
  { value: 'boolean', label: 'Caixa Sim/Não' },
  { value: 'tags', label: 'Tags / Marcadores' },
  { value: 'entity_ref', label: 'Vínculo a outra entidade' },
];

interface CustomFieldEditorRowProps {
  field: CustomFieldSchema;
  isPluginProvided: boolean;
  allEntityTypes: EntityTypeDefinition[];
  onSave: (updated: CustomFieldSchema) => void;
  onRemove: () => void;
}

export function CustomFieldEditorRow({
  field,
  isPluginProvided,
  allEntityTypes,
  onSave,
  onRemove,
}: CustomFieldEditorRowProps) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(field.label);
  const [draftType, setDraftType] = useState<CustomFieldType>(field.type);
  const [draftOptions, setDraftOptions] = useState((field.options ?? []).join(', '));
  const [draftPlaceholder, setDraftPlaceholder] = useState(field.placeholder ?? '');
  const [draftTargetType, setDraftTargetType] = useState(field.targetEntityType ?? 'character');
  const [draftRequired, setDraftRequired] = useState(Boolean(field.required));
  const [draftIncludeMemory, setDraftIncludeMemory] = useState(field.includeInMemory !== false);
  const [draftWeight, setDraftWeight] = useState(String(field.completenessWeight ?? 3));

  const startEditing = () => {
    setDraftLabel(field.label);
    setDraftType(field.type);
    setDraftOptions((field.options ?? []).join(', '));
    setDraftPlaceholder(field.placeholder ?? '');
    setDraftTargetType(field.targetEntityType ?? 'character');
    setDraftRequired(Boolean(field.required));
    setDraftIncludeMemory(field.includeInMemory !== false);
    setDraftWeight(String(field.completenessWeight ?? 3));
    setEditing(true);
  };

  const handleSave = () => {
    const parsedWeight = Number(draftWeight);
    onSave({
      ...field,
      label: draftLabel.trim() || field.label,
      type: draftType,
      options:
        draftType === 'select'
          ? draftOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      placeholder: draftPlaceholder.trim() || undefined,
      targetEntityType: draftType === 'entity_ref' ? draftTargetType : undefined,
      required: draftRequired,
      includeInMemory: draftIncludeMemory,
      completenessWeight: Number.isFinite(parsedWeight) && parsedWeight >= 0 ? parsedWeight : 0,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '10px 12px',
          borderRadius: THEME_VAR.radiusSm,
          backgroundColor: THEME_VAR.bgSurface,
          border: `1px solid ${THEME_VAR.accentPrimary}`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 8,
          }}
        >
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Rótulo</span>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              style={controlInputStyle}
            />
          </label>

          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Tipo de Dado</span>
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as CustomFieldType)}
              style={controlInputStyle}
            >
              {CUSTOM_FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Peso na Completude (%)</span>
            <input
              type="number"
              min={0}
              max={20}
              value={draftWeight}
              onChange={(e) => setDraftWeight(e.target.value)}
              style={controlInputStyle}
            />
          </label>
        </div>

        {draftType === 'select' && (
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Opções (separadas por vírgula)</span>
            <input
              value={draftOptions}
              onChange={(e) => setDraftOptions(e.target.value)}
              placeholder="Ex: Nível 1, Nível 2, Mestre ou A, B, C"
              style={controlInputStyle}
            />
          </label>
        )}

        {draftType === 'entity_ref' && (
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Entidade de Destino</span>
            <select
              value={draftTargetType}
              onChange={(e) => setDraftTargetType(e.target.value)}
              style={controlInputStyle}
            >
              {allEntityTypes.map((et) => (
                <option key={et.id} value={et.id}>
                  {et.label} ({et.id})
                </option>
              ))}
            </select>
          </label>
        )}

        <label style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>Placeholder / Ajuda de Preenchimento</span>
          <input
            value={draftPlaceholder}
            onChange={(e) => setDraftPlaceholder(e.target.value)}
            placeholder="Dica exibida quando o campo estiver vazio..."
            style={controlInputStyle}
          />
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11.5,
              color: THEME_VAR.textPrimary,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={draftRequired}
              onChange={(e) => setDraftRequired(e.target.checked)}
            />
            Campo obrigatório na ficha
          </label>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11.5,
              color: THEME_VAR.textPrimary,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={draftIncludeMemory}
              onChange={(e) => setDraftIncludeMemory(e.target.checked)}
            />
            Indexar no AI Memory / MCP
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={{ ...secondaryButtonStyle, padding: '4px 10px', fontSize: 11.5 }}
          >
            <X size={13} /> Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{ ...primaryButtonStyle, padding: '4px 10px', fontSize: 11.5 }}
          >
            <Check size={13} /> Salvar Campo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
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
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: THEME_VAR.textPrimary,
          }}
        >
          <span>{field.label}</span>
          <code style={{ fontSize: 11, color: THEME_VAR.textMuted }}>({field.key})</code>
          {field.required && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 999,
                backgroundColor: THEME_VAR.accentSoft,
                color: THEME_VAR.accentPrimary,
              }}
            >
              Obrigatório
            </span>
          )}
          {isPluginProvided && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 999,
                border: `1px solid ${THEME_VAR.borderSubtle}`,
                color: THEME_VAR.textSecondary,
              }}
            >
              Plugin
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: THEME_VAR.textSecondary }}>
          Tipo: {CUSTOM_FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
          {field.type === 'select' && field.options?.length
            ? ` (${field.options.join(', ')})`
            : ''}
          {field.includeInMemory !== false ? ' · Indexado no AI Memory' : ' · Oculto da IA'}
          {(field.completenessWeight ?? 0) > 0 ? ` · Peso ${field.completenessWeight}` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          onClick={startEditing}
          title="Editar tipo, opções e regras deste campo"
          style={{ ...secondaryButtonStyle, padding: '4px 8px', fontSize: 11.5 }}
        >
          <Pencil size={12} /> Editar
        </button>
        <button
          type="button"
          onClick={onRemove}
          title={isPluginProvided ? 'Ocultar campo deste plugin no workspace' : 'Excluir campo'}
          style={{ ...secondaryButtonStyle, color: '#ef4444', padding: '4px 8px' }}
        >
          {isPluginProvided ? <EyeOff size={13} /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}
