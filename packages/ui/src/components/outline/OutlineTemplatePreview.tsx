import { Sparkles } from 'lucide-react';
import type { NarrativeTemplate } from '../../data/templatesCatalog';

interface OutlineTemplatePreviewProps {
  template: NarrativeTemplate;
  contextConcept: string;
  onChangeConcept: (value: string) => void;
}

export function OutlineTemplatePreview({
  template,
  contextConcept,
  onChangeConcept,
}: OutlineTemplatePreviewProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflowY: 'auto',
        padding: 16,
        gap: 12,
      }}
    >
      <div>
        <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{template.name}</h4>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
          {template.arc}
        </p>
      </div>

      <div
        style={{
          padding: 10,
          borderRadius: 'var(--radius-md, 8px)',
          backgroundColor: 'var(--bg-elevated, #171d2e)',
          border: '1px solid var(--border-subtle, #263046)',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--text-secondary, #94a3b8)',
            marginBottom: 6,
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          Adaptar à premissa do projeto (opcional)
        </label>
        <input
          value={contextConcept}
          onChange={(e) => onChangeConcept(e.target.value)}
          placeholder="Ex.: Um comandante exilado descobre um pacto de sangue na capital..."
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-canvas, #0b0e16)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '7px 10px',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: 12,
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {template.sections.map((sec, idx) => (
          <div
            key={`${template.id}_${idx}`}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: sec.isTwist
                ? '1px solid rgba(245, 158, 11, 0.45)'
                : '1px solid var(--border-subtle, #263046)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{sec.title}</span>
              <span style={{ fontSize: 10.5, color: 'var(--accent-primary, #3b82f6)' }}>
                Ato {sec.act}
                {sec.isTwist ? ' · Twist' : ''}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
              {sec.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
