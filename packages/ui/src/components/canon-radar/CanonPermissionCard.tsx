import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { CanonAiPermission } from '../../types/project';
import {
  canonCardStyle,
  canonCardHeaderStyle,
  canonCardTitleStyle,
  canonLinkBtnStyle,
} from './canonRadarStyles';

const PERMISSION_MODES: {
  id: CanonAiPermission;
  label: string;
  desc: string;
}[] = [
  {
    id: 'observer',
    label: 'Observador',
    desc: 'Apenas detecta entidades e inconsistências sem escrever em arquivos.',
  },
  {
    id: 'staging',
    label: 'Rascunho Staging',
    desc: 'Envia propostas novas para ./workspace/staging/ aguardando revisão.',
  },
  {
    id: 'auto',
    label: 'Auto-Catalogar',
    desc: 'Cataloga entidades confirmadas automaticamente respeitando o cânone.',
  },
];

interface CanonPermissionCardProps {
  activePermission: CanonAiPermission;
  onOpenAiSettings: () => void;
}

export function CanonPermissionCard({
  activePermission,
  onOpenAiSettings,
}: CanonPermissionCardProps) {
  return (
    <section style={canonCardStyle}>
      <div style={canonCardHeaderStyle}>
        <span style={canonCardTitleStyle}>
          <ShieldCheck size={15} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          Modo de Permissão IA Ativo
        </span>
        <button type="button" onClick={onOpenAiSettings} style={canonLinkBtnStyle}>
          Alterar <ArrowUpRight size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PERMISSION_MODES.map((mode) => {
          const isActive = activePermission === mode.id;
          return (
            <div
              key={mode.id}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: isActive
                  ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
                  : 'var(--bg-elevated, var(--bg-card, #171d2e))',
                border: isActive
                  ? '1px solid var(--accent-primary, #3b82f6)'
                  : '1px solid var(--border-subtle, var(--border, #263046))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: isActive
                      ? 'var(--accent-primary, #3b82f6)'
                      : 'var(--text-primary, #f1f5f9)',
                  }}
                >
                  {mode.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 999,
                      backgroundColor: 'var(--accent-primary, #3b82f6)',
                      color: '#ffffff',
                    }}
                  >
                    Ativo
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
                {mode.desc}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
