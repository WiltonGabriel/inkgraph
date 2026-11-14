import { GitBranch, ArrowUpRight } from 'lucide-react';
import type { StagingProposal } from '../../types/project';
import {
  canonCardStyle,
  canonCardHeaderStyle,
  canonCardTitleStyle,
  canonLinkBtnStyle,
} from './canonRadarStyles';

interface CanonStagingQueueCardProps {
  pendingProposals: StagingProposal[];
  onOpenVersions: () => void;
}

export function CanonStagingQueueCard({
  pendingProposals,
  onOpenVersions,
}: CanonStagingQueueCardProps) {
  return (
    <section style={canonCardStyle}>
      <div style={canonCardHeaderStyle}>
        <span style={canonCardTitleStyle}>
          <GitBranch size={15} style={{ color: '#f59e0b' }} />
          Fila de Staging Pendente ({pendingProposals.length})
        </span>
        <button type="button" onClick={onOpenVersions} style={canonLinkBtnStyle}>
          Abrir Revisão <ArrowUpRight size={12} />
        </button>
      </div>

      {pendingProposals.length === 0 ? (
        <div
          style={{
            padding: 18,
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Nenhuma proposta pendente em <code>./workspace/staging/</code>. O cânone está sincronizado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pendingProposals.slice(0, 4).map((prop) => (
            <div
              key={prop.id}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
                border: '1px solid var(--border-subtle, var(--border, #263046))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <span>{prop.entityName}</span>
                <span style={{ fontSize: 10.5, color: '#f59e0b' }}>
                  {prop.action === 'create' ? 'Novo' : 'Atualização'} · {prop.entityType}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary, #94a3b8)',
                  marginTop: 2,
                }}
              >
                {prop.rationale}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
