import { AlertTriangle, Check } from 'lucide-react';
import type { BranchSceneConflict } from '../../domain/gitEngine';
import { VisualDiffViewer } from './VisualDiffViewer';

interface BranchConflictResolverCardProps {
  conflict: BranchSceneConflict;
  activeBranchName: string;
  sourceBranchName: string;
  choice: 'ours' | 'theirs';
  onSelectChoice: (sceneId: string, choice: 'ours' | 'theirs') => void;
}

export function BranchConflictResolverCard({
  conflict,
  activeBranchName,
  sourceBranchName,
  choice,
  onSelectChoice,
}: BranchConflictResolverCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid rgba(245, 158, 11, 0.42)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '0.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {conflict.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {activeBranchName}: {conflict.activeUpdatedAt.slice(0, 10)} · {sourceBranchName}:{' '}
              {conflict.incomingUpdatedAt.slice(0, 10)}
            </div>
          </div>
        </div>

        <div
          role="group"
          aria-label={`Resolução de conflito para ${conflict.title}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
        >
          <button
            type="button"
            aria-pressed={choice === 'ours'}
            onClick={() => onSelectChoice(conflict.sceneId, 'ours')}
            style={choiceBtnStyle(choice === 'ours', 'ours')}
          >
            {choice === 'ours' && <Check size={12} />}
            <span>Manter Ramo Atual (Ours)</span>
          </button>
          <button
            type="button"
            aria-pressed={choice === 'theirs'}
            onClick={() => onSelectChoice(conflict.sceneId, 'theirs')}
            style={choiceBtnStyle(choice === 'theirs', 'theirs')}
          >
            {choice === 'theirs' && <Check size={12} />}
            <span>Adotar Ramo Fonte (Theirs)</span>
          </button>
        </div>
      </div>

      <VisualDiffViewer
        baseText={conflict.activeContent}
        targetText={conflict.incomingContent}
        defaultMode="words"
        maxHeight={200}
      />
    </div>
  );
}

const choiceBtnStyle = (
  selected: boolean,
  variant: 'ours' | 'theirs'
): React.CSSProperties => {
  const activeColor = variant === 'ours' ? 'var(--accent-primary)' : '#10b981';
  const activeBg =
    variant === 'ours' ? 'var(--accent-soft)' : 'rgba(16, 185, 129, 0.14)';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize: 11.5,
    fontWeight: selected ? 700 : 500,
    backgroundColor: selected ? activeBg : 'var(--bg-surface)',
    border: selected
      ? `1px solid ${activeColor}`
      : '1px solid var(--border-subtle)',
    color: selected ? activeColor : 'var(--text-secondary)',
    cursor: 'pointer',
  };
};
