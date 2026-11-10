import { History } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { BranchAndSnapshotPanel } from '../components/publishing/BranchAndSnapshotPanel';
import { StagingGatekeeperPanel } from '../components/publishing/StagingGatekeeperPanel';

export function StagingApprovalView() {
  const { project } = useProject();
  const activeBranch = project.branches.find((b) => b.id === project.activeBranchId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <History size={20} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Controle de Versões, Instantâneos & Staging</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ramificação ativa: <strong>{activeBranch?.name ?? 'Principal'}</strong> • {project.snapshots.length} instantâneo(s)
            </p>
          </div>
        </div>
      </div>

      <BranchAndSnapshotPanel />
      <StagingGatekeeperPanel />
    </div>
  );
}
