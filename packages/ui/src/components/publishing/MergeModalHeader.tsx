import { ArrowRight, GitMerge, X } from 'lucide-react';
import type { Branch } from '../../types/project';

interface MergeModalHeaderProps {
  titleId: string;
  selectId: string;
  otherBranches: Branch[];
  sourceBranchId: string;
  activeBranchName: string;
  onChangeSource: (branchId: string) => void;
  onClose: () => void;
}

export function MergeModalHeader({
  titleId,
  selectId,
  otherBranches,
  sourceBranchId,
  activeBranchName,
  onChangeSource,
  onClose,
}: MergeModalHeaderProps) {
  return (
    <div style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <GitMerge size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <h2 id={titleId} style={{ fontSize: 15, fontWeight: 700 }}>
            Comparar e Mesclar Ramificação
          </h2>
          <div style={branchSelectRowStyle}>
            <label htmlFor={selectId} style={{ fontSize: 11.5 }}>
              Origem:
            </label>
            <select
              id={selectId}
              autoFocus
              value={sourceBranchId}
              onChange={(e) => onChangeSource(e.target.value)}
              disabled={otherBranches.length === 0}
              style={selectStyle}
            >
              {otherBranches.length === 0 ? (
                <option value="">Nenhuma outra ramificação</option>
              ) : (
                otherBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))
              )}
            </select>
            <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
            <span style={activeBadgeStyle}>{activeBranchName} (Atual)</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar comparação de mesclagem"
        style={closeBtnStyle}
      >
        <X size={18} />
      </button>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '0.9rem 1.1rem',
  backgroundColor: 'var(--bg-elevated)',
  borderBottom: '1px solid var(--border-subtle)',
  flexShrink: 0,
};

const branchSelectRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 4,
  flexWrap: 'wrap',
  fontSize: 12,
  color: 'var(--text-secondary)',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '3px 8px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const activeBadgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: 'var(--accent-soft)',
  color: 'var(--accent-primary)',
  fontWeight: 700,
  fontSize: 11.5,
};

const closeBtnStyle: React.CSSProperties = {
  padding: 6,
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
