interface CompletenessRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

export function CompletenessRing({
  percent,
  size = 40,
  strokeWidth = 3.5,
}: CompletenessRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 80
      ? '#10b981'
      : clamped >= 50
        ? '#f59e0b'
        : '#ef4444';

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={`Perfil ${clamped}% concluído`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
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
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          fontSize: size <= 36 ? 9 : 10,
          fontWeight: 700,
          color: '#e5e7eb',
        }}
      >
        {clamped}%
      </span>
    </div>
  );
}
