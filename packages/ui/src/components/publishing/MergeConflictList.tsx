import type { BranchSceneConflict } from '../../domain/gitEngine';
import { BranchConflictResolverCard } from './BranchConflictResolverCard';

interface MergeConflictListProps {
  conflicts: BranchSceneConflict[];
  activeBranchName: string;
  sourceBranchName: string;
  resolvedMap: Record<string, 'ours' | 'theirs'>;
  onSelectChoice: (sceneId: string, choice: 'ours' | 'theirs') => void;
  onSelectAll: (choice: 'ours' | 'theirs') => void;
}

export function MergeConflictList({
  conflicts,
  activeBranchName,
  sourceBranchName,
  resolvedMap,
  onSelectChoice,
  onSelectAll,
}: MergeConflictListProps) {
  if (conflicts.length === 0) return null;

  return (
    <section
      aria-label="Resolução de conflitos"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
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
        <h3 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
          Conflitos de Conteúdo ({conflicts.length})
        </h3>
        {conflicts.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => onSelectAll('ours')} style={bulkBtnStyle}>
              Todos: Ramo Atual
            </button>
            <button type="button" onClick={() => onSelectAll('theirs')} style={bulkBtnStyle}>
              Todos: Ramo Fonte
            </button>
          </div>
        )}
      </div>

      {conflicts.map((conflict) => (
        <BranchConflictResolverCard
          key={conflict.sceneId}
          conflict={conflict}
          activeBranchName={activeBranchName}
          sourceBranchName={sourceBranchName}
          choice={resolvedMap[conflict.sceneId]}
          onSelectChoice={onSelectChoice}
        />
      ))}
    </section>
  );
}

const bulkBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontWeight: 600,
};
