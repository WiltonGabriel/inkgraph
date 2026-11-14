interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  accentColor?: string;
  animate?: boolean;
  ariaLabel?: string;
}

export function ProgressRing({
  percent,
  size = 64,
  strokeWidth = 5,
  accentColor,
  animate = true,
  ariaLabel,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    accentColor ??
    (clamped >= 80
      ? 'var(--success, #10b981)'
      : clamped >= 40
        ? 'var(--accent-primary, #3b82f6)'
        : '#f59e0b');

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `${clamped}% concluído`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          opacity={0.55}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={
            animate
              ? { transition: 'stroke-dashoffset 320ms cubic-bezier(0.22, 1, 0.36, 1), stroke 180ms ease' }
              : undefined
          }
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          fontSize: size <= 44 ? 10 : 12,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {clamped}%
      </span>
    </div>
  );
}
