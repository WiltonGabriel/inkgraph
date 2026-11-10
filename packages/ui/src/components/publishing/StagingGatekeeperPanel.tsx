import { CheckCircle2, XCircle, FileDiff, ShieldCheck } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function StagingGatekeeperPanel() {
  const { project, resolveStagingProposal } = useProject();

  const pendingProposals = project.stagingProposals.filter((p) => p.status === 'pending');

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="#10b981" />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Propostas Pendentes em Staging (./workspace/staging/)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Inspeção de frontmatter YAML e impacto epistêmico antes da canonização em <code>./workspace/lore/</code>.
            </p>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
          {pendingProposals.length} pendente(s)
        </span>
      </div>

      {pendingProposals.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '6px', padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Nenhuma proposta pendente em <code>./workspace/staging/</code>. O cânone oficial está íntegro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {pendingProposals.map((prop) => (
            <div key={prop.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>
                    {prop.action === 'create' ? 'Nova Entidade' : 'Atualização'} • {prop.entityType}
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{prop.entityName} ({prop.fileName})</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Destino canônico: <code>{prop.canonicalPath}</code>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <button
                    onClick={() => resolveStagingProposal(prop.id, 'rejected')}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.4rem 0.75rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <XCircle size={14} /> Rejeitar
                  </button>
                  <button
                    onClick={() => resolveStagingProposal(prop.id, 'approved')}
                    style={{ background: '#10b981', color: '#fff', padding: '0.4rem 0.85rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <CheckCircle2 size={14} /> Aprovar e Canonizar
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', borderLeft: '3px solid var(--accent)', paddingLeft: '0.6rem' }}>
                <strong>Justificativa:</strong> {prop.rationale}
              </div>

              {prop.epistemicImpact.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {prop.epistemicImpact.map((imp, idx) => (
                    <span key={idx} style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      Impacto Epistêmico: {imp}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  <FileDiff size={12} /> Diff de Frontmatter YAML & Corpo Markdown
                </div>
                <pre style={{ background: '#070a10', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.65rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', overflowX: 'auto' }}>
                  {`---\n${JSON.stringify(prop.proposedFrontmatter, null, 2)}\n---\n\n${prop.proposedMarkdown}`}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
