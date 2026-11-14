import { useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { listUnifiedEntities } from '../../domain/registry';
import type { CustomFieldSchema } from '../../types/project';

interface DynamicFieldRendererProps {
  fields: CustomFieldSchema[];
  values: Record<string, unknown>;
  onChange: (nextValues: Record<string, unknown>) => void;
  title?: string;
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 9px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm, 6px)',
  color: 'var(--text-primary)',
  fontSize: 12.5,
};

const labelStyle: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 4,
};

export function DynamicFieldRenderer({
  fields,
  values,
  onChange,
  title = 'Campos Personalizados do Modelo',
}: DynamicFieldRendererProps) {
  const { project } = useProject();
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});

  if (fields.length === 0) return null;

  const setFieldValue = (key: string, val: unknown) => {
    onChange({ ...values, [key]: val });
  };

  const entities = listUnifiedEntities(project);

  // Group fields optionally
  const groups = Array.from(new Set(fields.map((f) => f.group || 'Geral')));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 12,
        borderRadius: 'var(--radius-md, 8px)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)',
        }}
      >
        {title}
      </div>

      {groups.map((groupName) => {
        const groupFields = fields.filter((f) => (f.group || 'Geral') === groupName);
        return (
          <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groups.length > 1 && (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)' }}>
                {groupName}
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 10,
              }}
            >
              {groupFields.map((field) => {
                const rawVal = values[field.key];

                if (field.type === 'textarea') {
                  return (
                    <div key={field.key} style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>
                        {field.label}
                        {field.required ? ' *' : ''}
                      </label>
                      <textarea
                        rows={3}
                        value={typeof rawVal === 'string' ? rawVal : ''}
                        placeholder={field.placeholder ?? ''}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>
                  );
                }

                if (field.type === 'boolean') {
                  return (
                    <label
                      key={field.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm, 6px)',
                        fontSize: 12.5,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(rawVal)}
                        onChange={(e) => setFieldValue(field.key, e.target.checked)}
                      />
                      <span>{field.label}</span>
                    </label>
                  );
                }

                if (field.type === 'select') {
                  const options = field.options ?? [];
                  return (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      <select
                        value={typeof rawVal === 'string' ? rawVal : ''}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Selecionar...</option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'entity_ref') {
                  const refOptions = field.targetEntityType
                    ? entities.filter((e) => e.entityTypeId === field.targetEntityType)
                    : entities;
                  return (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      <select
                        value={typeof rawVal === 'string' ? rawVal : ''}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Nenhuma referência</option>
                        {refOptions.map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.name} ({ent.typeLabel})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'tags') {
                  const list = Array.isArray(rawVal)
                    ? rawVal.filter((t): t is string => typeof t === 'string')
                    : [];
                  const draft = tagDrafts[field.key] ?? '';
                  return (
                    <div key={field.key} style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>{field.label}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                        {list.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              fontSize: 11,
                              borderRadius: 999,
                              backgroundColor: 'var(--accent-soft)',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                setFieldValue(
                                  field.key,
                                  list.filter((t) => t !== tag)
                                )
                              }
                              style={{ background: 'none', color: 'inherit', padding: 0 }}
                              aria-label={`Remover ${tag}`}
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        value={draft}
                        placeholder={field.placeholder ?? 'Digite e pressione Enter...'}
                        onChange={(e) =>
                          setTagDrafts((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && draft.trim()) {
                            e.preventDefault();
                            const nextTag = draft.trim();
                            if (!list.includes(nextTag)) {
                              setFieldValue(field.key, [...list, nextTag]);
                            }
                            setTagDrafts((prev) => ({ ...prev, [field.key]: '' }));
                          }
                        }}
                        style={inputStyle}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label style={labelStyle}>
                      {field.label}
                      {field.required ? ' *' : ''}
                    </label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={
                        field.type === 'number'
                          ? typeof rawVal === 'number'
                            ? String(rawVal)
                            : ''
                          : typeof rawVal === 'string'
                            ? rawVal
                            : ''
                      }
                      placeholder={field.placeholder ?? ''}
                      onChange={(e) =>
                        setFieldValue(
                          field.key,
                          field.type === 'number'
                            ? e.target.value === ''
                              ? undefined
                              : Number(e.target.value)
                            : e.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
