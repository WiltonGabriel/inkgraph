import { useId, useState, type CSSProperties } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { CanonScoreBadgeInfo } from '../../domain/canonScoreCalculator';

export const worldStyles = {
  card: {
    backgroundColor: 'var(--bg-surface, #111623)',
    border: '1px solid var(--border-subtle, #263046)',
    borderRadius: 'var(--radius-md, 8px)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  } satisfies CSSProperties,
  label: {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--text-secondary, #94a3b8)',
    marginBottom: 4,
  } satisfies CSSProperties,
  input: {
    width: '100%',
    backgroundColor: 'var(--bg-elevated, #171d2e)',
    border: '1px solid var(--border-subtle, #263046)',
    borderRadius: 'var(--radius-sm, 6px)',
    padding: '7px 10px',
    color: 'var(--text-primary, #f1f5f9)',
    fontSize: 12.5,
  } satisfies CSSProperties,
  textarea: {
    width: '100%',
    backgroundColor: 'var(--bg-elevated, #171d2e)',
    border: '1px solid var(--border-subtle, #263046)',
    borderRadius: 'var(--radius-sm, 6px)',
    padding: '8px 10px',
    color: 'var(--text-primary, #f1f5f9)',
    fontSize: 12.5,
    lineHeight: 1.5,
    resize: 'vertical',
  } satisfies CSSProperties,
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm, 6px)',
    border: 'none',
    backgroundColor: 'var(--accent-primary, #3b82f6)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  } satisfies CSSProperties,
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm, 6px)',
    border: '1px solid var(--border-subtle, #263046)',
    backgroundColor: 'var(--bg-elevated, #171d2e)',
    color: 'var(--text-primary, #f1f5f9)',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  } satisfies CSSProperties,
  dangerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 9px',
    borderRadius: 'var(--radius-sm, 6px)',
    border: '1px solid rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  } satisfies CSSProperties,
  chip: (active: boolean): CSSProperties => ({
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: active ? 700 : 500,
    border: active
      ? '1px solid var(--accent-primary, #3b82f6)'
      : '1px solid var(--border-subtle, #263046)',
    backgroundColor: active
      ? 'var(--accent-soft, rgba(59,130,246,0.14))'
      : 'var(--bg-elevated, #171d2e)',
    color: active ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)',
    cursor: 'pointer',
  }),
};

export function CanonBadgePill({ badge, compact = false }: { badge: CanonScoreBadgeInfo; compact?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: compact ? '1px 6px' : '2px 8px',
        borderRadius: 999,
        fontSize: compact ? 10.5 : 11.5,
        fontWeight: 700,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        color: badge.color,
        backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${badge.color} 40%, transparent)`,
      }}
    >
      <span>{badge.score}/10</span>
      {!compact && <span style={{ fontWeight: 600 }}>· {badge.label}</span>}
    </span>
  );
}

/**
 * Top maturity checklist banner rendered above each active worldbuilding pillar.
 */
export function WorldScoreChecklistBanner({
  pillarLabel,
  badge,
}: {
  pillarLabel: string;
  badge: CanonScoreBadgeInfo;
}) {
  const [expanded, setExpanded] = useState(false);
  const checklistId = useId();
  const missingCount = badge.missingItems.length;
  const pct = Math.round((badge.filledCount / Math.max(1, badge.totalCount)) * 100);

  return (
    <section aria-label={`Maturidade do pilar ${pillarLabel}`} style={{ ...worldStyles.card, padding: '12px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
            {pillarLabel}
          </h3>
          <CanonBadgePill badge={badge} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
            {badge.filledCount}/{badge.totalCount} critérios preenchidos
          </span>
        </div>

        {missingCount > 0 ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={checklistId}
            onClick={() => setExpanded((prev) => !prev)}
            style={worldStyles.secondaryBtn}
          >
            <AlertCircle size={13} color={badge.color} />
            <span>{missingCount === 1 ? 'Falta 1 item para 10/10' : `Faltam ${missingCount} itens para 10/10`}</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#10b981' }}>
            <CheckCircle2 size={14} /> Pilar completo (10/10)
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-valuenow={badge.filledCount}
        aria-valuemin={0}
        aria-valuemax={badge.totalCount}
        aria-label={`Preenchimento de ${pillarLabel}: ${badge.filledCount} de ${badge.totalCount}`}
        style={{ height: 6, width: '100%', borderRadius: 999, backgroundColor: 'var(--bg-elevated, #171d2e)', overflow: 'hidden' }}
      >
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, backgroundColor: badge.color, transition: 'width 180ms ease' }} />
      </div>

      {expanded && missingCount > 0 && (
        <ul
          id={checklistId}
          style={{
            margin: 0,
            padding: '8px 12px 2px 20px',
            borderTop: '1px solid var(--border-subtle, #263046)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontSize: 12.5,
            color: 'var(--text-secondary, #94a3b8)',
          }}
        >
          {badge.missingItems.map((item) => (
            <li key={item} style={{ lineHeight: 1.45 }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
