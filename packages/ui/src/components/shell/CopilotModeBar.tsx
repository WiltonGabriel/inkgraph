import { Layers, ShieldCheck } from 'lucide-react';
import type { CanonAiPermission } from '../../types/project';

const PERMISSION_OPTIONS: {
  id: CanonAiPermission;
  label: string;
  title: string;
}[] = [
  {
    id: 'observer',
    label: 'Observador',
    title: 'Apenas analisa e propõe sem alterar arquivos do cânone.',
  },
  {
    id: 'staging',
    label: 'Staging',
    title: 'Envia propostas novas para revisão em ./workspace/staging/.',
  },
  {
    id: 'auto',
    label: 'Auto-Catalogar',
    title: 'Prioriza aplicação direta no rascunho com snapshot automático.',
  },
];

export interface CopilotModeBarProps {
  canonPermission: CanonAiPermission;
  memoryEnabled: boolean;
  onChangePermission: (next: CanonAiPermission) => void;
  onToggleMemory: () => void;
}

export function CopilotModeBar({
  canonPermission,
  memoryEnabled,
  onChangePermission,
  onToggleMemory,
}: CopilotModeBarProps) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 600,
            color: 'var(--text-muted, #64748b)',
          }}
        >
          <ShieldCheck size={11} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          Permissão:
        </span>

        <div
          role="group"
          aria-label="Permissão da IA no cânone"
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: 2,
            gap: 2,
          }}
        >
          {PERMISSION_OPTIONS.map((opt) => {
            const active = canonPermission === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                title={opt.title}
                onClick={() => onChangePermission(opt.id)}
                style={{
                  padding: '2px 7px',
                  borderRadius: 'calc(var(--radius-sm, 6px) - 2px)',
                  fontSize: 10.5,
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active
                    ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
                    : 'transparent',
                  color: active
                    ? 'var(--accent-primary, #3b82f6)'
                    : 'var(--text-secondary, #94a3b8)',
                  border: active
                    ? '1px solid color-mix(in srgb, var(--accent-primary, #3b82f6) 40%, transparent)'
                    : '1px solid transparent',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            color: 'var(--text-muted, #64748b)',
            fontWeight: 600,
          }}
        >
          Compilador de Memória:
        </span>

        <button
          type="button"
          aria-pressed={memoryEnabled}
          onClick={onToggleMemory}
          title="Alternar compilação das 4 camadas de memória"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 600,
            backgroundColor: memoryEnabled
              ? 'color-mix(in srgb, #10b981 14%, transparent)'
              : 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: memoryEnabled
              ? '1px solid color-mix(in srgb, #10b981 36%, transparent)'
              : '1px solid var(--border-subtle, var(--border, #263046))',
            color: memoryEnabled
              ? 'color-mix(in srgb, #10b981 74%, var(--text-primary, #f1f5f9))'
              : 'var(--text-secondary, #94a3b8)',
          }}
        >
          <Layers size={11} />
          {memoryEnabled ? '4 Camadas Ativas' : 'Pausado (Camada 1)'}
        </button>
      </div>
    </div>
  );
}
