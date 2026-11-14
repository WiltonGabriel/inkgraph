import { Radar, GitBranch, SlidersHorizontal } from 'lucide-react';

interface CanonRadarHeaderProps {
  title: string;
  pendingCount: number;
  onOpenVersions: () => void;
  onOpenAiSettings: () => void;
}

export function CanonRadarHeader({
  title,
  pendingCount,
  onOpenVersions,
  onOpenAiSettings,
}: CanonRadarHeaderProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        border: '1px solid var(--border-subtle, var(--border, #263046))',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: 'var(--card-shadow, none)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
            color: 'var(--accent-primary, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Radar size={19} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12.5,
              color: 'var(--text-secondary, #94a3b8)',
            }}
          >
            Monitoramento de descobertas no manuscrito, separação de cânone e fila de revisão em staging.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onOpenVersions}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <GitBranch size={13} style={{ color: '#10b981' }} />
          {pendingCount === 1
            ? '1 pendente no Staging'
            : `${pendingCount} pendentes no Staging`}
        </button>
        <button
          type="button"
          onClick={onOpenAiSettings}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--accent-primary, #3b82f6)',
            border: 'none',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={13} />
          Configurar IA & MCP
        </button>
      </div>
    </div>
  );
}
