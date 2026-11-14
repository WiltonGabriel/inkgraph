import type { ReactNode } from 'react';

interface FloatingChartTooltipProps {
  id: string;
  visible: boolean;
  xPercent: number;
  placement?: 'top' | 'bottom';
  minWidth?: number;
  maxWidth?: number;
  interactive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: ReactNode;
}

export function FloatingChartTooltip({
  id,
  visible,
  xPercent,
  placement = 'top',
  minWidth = 190,
  maxWidth = 280,
  interactive = false,
  onMouseEnter,
  onMouseLeave,
  children,
}: FloatingChartTooltipProps) {
  if (!visible) return null;

  const clampedX = Math.max(6, Math.min(94, xPercent));
  const translateX =
    xPercent < 20 ? '-8%' : xPercent > 80 ? '-92%' : '-50%';

  return (
    <div
      id={id}
      role="tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        left: `${clampedX}%`,
        ...(placement === 'top'
          ? { bottom: 'calc(100% + 8px)' }
          : { top: 'calc(100% + 8px)' }),
        transform: `translateX(${translateX})`,
        zIndex: 60,
        minWidth,
        maxWidth,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      <div
        className="ig-tooltip-fade"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '10px 12px',
          color: 'var(--text-primary)',
          boxShadow:
            '0 12px 28px -8px color-mix(in srgb, #000000 32%, transparent)',
          fontSize: 11.5,
          lineHeight: 1.45,
        }}
      >
        {children}
      </div>
    </div>
  );
}
