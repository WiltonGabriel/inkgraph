import type { BranchDiffSummary } from '../../domain/gitEngine';

export function MergeSummaryBar({ diff }: { diff: BranchDiffSummary }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <SummaryPill label="Cenas adicionadas" count={diff.scenesAdded.length} tone="positive" />
      <SummaryPill label="Cenas modificadas" count={diff.scenesModified.length} tone="accent" />
      <SummaryPill label="Cenas removidas" count={diff.scenesRemoved.length} tone="negative" />
      <SummaryPill label="Entidades alteradas" count={diff.entitiesChanged} tone="neutral" />
      <SummaryPill
        label="Conflitos"
        count={diff.conflicts.length}
        tone={diff.conflicts.length > 0 ? 'warning' : 'neutral'}
      />
    </div>
  );
}

function SummaryPill({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'positive' | 'negative' | 'accent' | 'warning' | 'neutral';
}) {
  const color =
    tone === 'positive'
      ? '#10b981'
      : tone === 'negative'
        ? '#ef4444'
        : tone === 'warning'
          ? '#f59e0b'
          : tone === 'accent'
            ? 'var(--accent-primary)'
            : 'var(--text-secondary)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        fontSize: 11.5,
        color: 'var(--text-secondary)',
      }}
    >
      <span>{label}:</span>
      <strong style={{ color }}>{count}</strong>
    </span>
  );
}
