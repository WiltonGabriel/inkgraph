import { CheckCircle2, XCircle, FileDiff, ShieldCheck } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { VisualDiffViewer } from './VisualDiffViewer';

export function StagingGatekeeperPanel() {
  const { project, resolveStagingProposal, notify } = useProject();

  const pendingProposals = project.stagingProposals.filter(
    (p) => p.status === 'pending'
  );

  const handleDecision = (
    id: string,
    entityName: string,
    decision: 'approved' | 'rejected'
  ) => {
    resolveStagingProposal(id, decision);
    notify(
      decision === 'approved'
        ? `Proposta "${entityName}" canonizada com sucesso.`
        : `Proposta "${entityName}" rejeitada e removida da fila.`,
      decision === 'approved' ? 'success' : 'info'
    );
  };

  return (
    <section
      aria-label="Propostas pendentes em Staging"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Propostas Pendentes em Staging (./workspace/staging/)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Inspeção de frontmatter YAML, diff textual e impacto epistêmico antes da canonização em{' '}
              <code>./workspace/lore/</code>.
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            padding: '0.22rem 0.65rem',
            borderRadius: 999,
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          {pendingProposals.length} pendente(s)
        </span>
      </div>

      {pendingProposals.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '1.25rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
          }}
        >
          Nenhuma proposta pendente em <code>./workspace/staging/</code>. O cânone oficial está íntegro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {pendingProposals.map((prop) => {
            const hasExisting = Boolean(prop.existingMarkdown?.trim());
            return (
              <article
                key={prop.id}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                      }}
                    >
                      {prop.action === 'create' ? 'Nova Entidade' : 'Atualização'} •{' '}
                      {prop.entityType}
                    </span>
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {prop.entityName} ({prop.fileName})
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Destino canônico: <code>{prop.canonicalPath}</code>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => handleDecision(prop.id, prop.entityName, 'rejected')}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.14)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-sm, 6px)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <XCircle size={14} /> Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(prop.id, prop.entityName, 'approved')}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-sm, 6px)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <CheckCircle2 size={14} /> Aprovar e Canonizar
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    borderLeft: '3px solid var(--accent-primary)',
                    paddingLeft: '0.6rem',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Justificativa:</strong>{' '}
                  {prop.rationale}
                </div>

                {prop.epistemicImpact.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {prop.epistemicImpact.map((imp, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          backgroundColor: 'rgba(245, 158, 11, 0.14)',
                          color: '#f59e0b',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 4,
                        }}
                      >
                        Impacto Epistêmico: {imp}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <FileDiff size={13} style={{ color: 'var(--accent-primary)' }} />
                    <span>
                      {hasExisting
                        ? 'Diff Visual (Canônico Atual vs Proposta)'
                        : 'Novo Conteúdo Proposto'}
                    </span>
                  </div>

                  <VisualDiffViewer
                    baseText={prop.existingMarkdown ?? ''}
                    targetText={prop.proposedMarkdown}
                    defaultMode={hasExisting ? 'words' : 'lines'}
                    maxHeight={240}
                  />

                  <details>
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontSize: 11.5,
                        color: 'var(--text-muted)',
                        userSelect: 'none',
                      }}
                    >
                      Ver metadados YAML propostos
                    </summary>
                    <pre
                      style={{
                        marginTop: 6,
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm, 6px)',
                        padding: '0.6rem',
                        fontSize: '0.74rem',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        color: 'var(--text-secondary)',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(prop.proposedFrontmatter, null, 2)}
                    </pre>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
