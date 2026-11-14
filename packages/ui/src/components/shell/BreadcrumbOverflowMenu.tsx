import { MoreHorizontal } from 'lucide-react';
import type { BreadcrumbSegment } from './breadcrumbSegments';

interface BreadcrumbOverflowMenuProps {
  hiddenSegments: BreadcrumbSegment[];
  isOpen: boolean;
  isEn: boolean;
  onToggle: () => void;
  onSelectSegment: (segment: BreadcrumbSegment) => void;
}

export function BreadcrumbOverflowMenu({
  hiddenSegments,
  isOpen,
  isEn,
  onToggle,
  onSelectSegment,
}: BreadcrumbOverflowMenuProps) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={isOpen}
        aria-label={isEn ? 'Show hidden path segments' : 'Mostrar segmentos ocultos'}
        title={hiddenSegments.map((s) => s.label).join(' / ')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3px 6px',
          borderRadius: 'var(--radius-sm, 6px)',
          backgroundColor: isOpen
            ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
            : 'var(--bg-elevated, var(--bg-card, #171d2e))',
          border: '1px solid var(--border-subtle, var(--border, #263046))',
          color: isOpen
            ? 'var(--accent-primary, #3b82f6)'
            : 'var(--text-secondary, #94a3b8)',
          cursor: 'pointer',
        }}
      >
        <MoreHorizontal size={12} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: 180,
            maxWidth: 260,
            zIndex: 150,
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.32)',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {hiddenSegments.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => onSelectSegment(seg)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: 12,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: seg.onClick ? 'pointer' : 'default',
              }}
            >
              {seg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
