import { useState, type FormEvent } from 'react';
import { Check, GitBranch, GitMerge, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface BranchListSectionProps {
  onOpenMergeDiff: (sourceBranchId: string) => void;
}

export function BranchListSection({ onOpenMergeDiff }: BranchListSectionProps) {
  const {
    project,
    createBranch,
    switchBranch,
    deleteBranch,
    requestConfirm,
    notify,
  } = useProject();

  const [branchName, setBranchName] = useState('');
  const [branchDesc, setBranchDesc] = useState('');

  const handleAddBranch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = branchName.trim();
    if (!trimmed) return;
    createBranch(trimmed, branchDesc.trim() || 'Ramificação narrativa');
    notify(`Ramificação "${trimmed}" criada e ativada.`, 'success');
    setBranchName('');
    setBranchDesc('');
  };

  const handleDeleteBranch = async (branchId: string, name: string) => {
    if (branchId === project.activeBranchId || project.branches.length <= 1) return;
    const confirmed = await requestConfirm({
      title: 'Excluir Ramificação',
      message: `Deseja excluir a ramificação "${name}"? O estado salvo exclusivamente nela será removido.`,
      confirmLabel: 'Excluir Ramo',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;
    deleteBranch(branchId);
    notify(`Ramificação "${name}" excluída.`, 'info');
  };

  return (
    <section
      aria-label="Ramificações do Projeto"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <GitBranch size={16} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ramificações Narrativas
          </h3>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 999,
            padding: '2px 8px',
          }}
        >
          {project.branches.length} {project.branches.length === 1 ? 'ramo' : 'ramos'}
        </span>
      </div>

      <ul
        style={{
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: 220,
          overflowY: 'auto',
        }}
      >
        {project.branches.map((branch) => {
          const active = branch.id === project.activeBranchId;
          const canDelete = !active && project.branches.length > 1;
          return (
            <li
              key={branch.id}
              style={{
                backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                border: active
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: '0.6rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <strong style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                    {branch.name}
                  </strong>
                  {active && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: 999,
                        padding: '1px 7px',
                      }}
                    >
                      <Check size={10} /> Ativo
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  {branch.createdAt}
                </span>
              </div>

              {branch.description && (
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {branch.description}
                </p>
              )}

              {!active && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      switchBranch(branch.id);
                      notify(`Ramo ativo alterado para "${branch.name}".`, 'success');
                    }}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    Ativar (Checkout)
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenMergeDiff(branch.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      backgroundColor: 'var(--accent-soft)',
                      border: '1px solid var(--accent-primary)',
                      color: 'var(--accent-primary)',
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    <GitMerge size={12} /> Comparar / Mesclar...
                  </button>

                  <button
                    type="button"
                    disabled={!canDelete}
                    onClick={() => void handleDeleteBranch(branch.id, branch.name)}
                    title="Excluir ramificação"
                    aria-label={`Excluir ramificação ${branch.name}`}
                    style={{
                      marginLeft: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={handleAddBranch}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.2rem' }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="Nome da nova ramificação..."
            aria-label="Nome da nova ramificação"
            style={fieldStyle}
          />
          <button
            type="submit"
            disabled={!branchName.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: branchName.trim()
                ? 'var(--accent-primary)'
                : 'var(--bg-hover)',
              color: branchName.trim() ? '#ffffff' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '0.38rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: branchName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={13} /> Criar Ramificação
          </button>
        </div>
        <input
          type="text"
          value={branchDesc}
          onChange={(e) => setBranchDesc(e.target.value)}
          placeholder="Descrição narrativa (opcional)"
          aria-label="Descrição narrativa opcional"
          style={fieldStyle}
        />
      </form>
    </section>
  );
}

const fieldStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '0.38rem 0.65rem',
  fontSize: '0.78rem',
  color: 'var(--text-primary)',
};
