import { History } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { BranchAndSnapshotPanel } from '../components/publishing/BranchAndSnapshotPanel';
import { StagingGatekeeperPanel } from '../components/publishing/StagingGatekeeperPanel';

export function StagingApprovalView() {
  const { project } = useProject();
  const activeBranch = project.branches.find(
    (b) => b.id === project.activeBranchId
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        overflowY: 'auto',
        padding: '1.1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '1rem 1.1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <History size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <div>
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Controle de Versões, Instantâneos &amp; Staging
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Ramificação ativa:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {activeBranch?.name ?? 'Principal'}
              </strong>{' '}
              • {project.branches.length}{' '}
              {project.branches.length === 1 ? 'ramo' : 'ramos'} •{' '}
              {project.snapshots.length}{' '}
              {project.snapshots.length === 1 ? 'instantâneo' : 'instantâneos'}
            </p>
          </div>
        </div>
      </div>

      <BranchAndSnapshotPanel />
      <StagingGatekeeperPanel />
    </div>
  );
}
