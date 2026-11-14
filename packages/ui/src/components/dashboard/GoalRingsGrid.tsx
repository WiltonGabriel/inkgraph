import { useId, useState } from 'react';
import { Target } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useViewport } from '../../hooks/useViewport';
import { DASHBOARD_CARD_STYLE, isMotionEnabled } from './dashboardTheme';
import { FloatingChartTooltip } from './FloatingChartTooltip';
import { ProgressRing } from './ProgressRing';

interface GoalRingsGridProps {
  todayWords: number;
  weeklyWords: number;
  dailyGoal: number;
  weeklyGoal: number;
}

export function GoalRingsGrid({
  todayWords,
  weeklyWords,
  dailyGoal,
  weeklyGoal,
}: GoalRingsGridProps) {
  const { settings, setActiveView } = useProject();
  const { isMobile } = useViewport();
  const [hoveredGoal, setHoveredGoal] = useState<'daily' | 'weekly' | null>(null);
  const tooltipId = useId();
  const motionEnabled = isMotionEnabled(settings);

  const dailyPct = Math.min(100, Math.round((todayWords / Math.max(1, dailyGoal)) * 100));
  const weeklyPct = Math.min(100, Math.round((weeklyWords / Math.max(1, weeklyGoal)) * 100));

  const items = [
    {
      key: 'daily' as const,
      title: 'META DIÁRIA',
      tipTitle: `Meta Diária (${dailyPct}%)`,
      writtenLabel: 'Escritas hoje',
      words: todayWords,
      goal: dailyGoal,
      percent: dailyPct,
      color: 'var(--accent-primary)',
    },
    {
      key: 'weekly' as const,
      title: 'META SEMANAL',
      tipTitle: `Meta Semanal (${weeklyPct}%)`,
      writtenLabel: 'Últimos 7 registros',
      words: weeklyWords,
      goal: weeklyGoal,
      percent: weeklyPct,
      color: 'var(--success, #10b981)',
    },
  ];

  const activeTip = items.find((i) => i.key === hoveredGoal) ?? null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 14,
        position: 'relative',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setHoveredGoal(null);
      }}
    >
      <FloatingChartTooltip
        id={tooltipId}
        visible={activeTip !== null}
        xPercent={hoveredGoal === 'daily' ? 25 : 75}
        minWidth={210}
        maxWidth={270}
      >
        {activeTip && (
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{activeTip.tipTitle}</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
              {activeTip.writtenLabel}: {activeTip.words.toLocaleString('pt-BR')} palavras
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Restante: {Math.max(0, activeTip.goal - activeTip.words).toLocaleString('pt-BR')} pal.
            </div>
            <div style={{ color: 'var(--accent-primary)', fontSize: 10.5, marginTop: 3 }}>
              Clique para abrir o Manuscrito
            </div>
          </div>
        )}
      </FloatingChartTooltip>

      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="ig-card-interactive"
          aria-describedby={hoveredGoal === item.key ? tooltipId : undefined}
          onMouseEnter={() => setHoveredGoal(item.key)}
          onMouseLeave={() => setHoveredGoal((g) => (g === item.key ? null : g))}
          onFocus={() => setHoveredGoal(item.key)}
          onBlur={() => setHoveredGoal((g) => (g === item.key ? null : g))}
          onClick={() => setActiveView('manuscript')}
          style={{
            ...DASHBOARD_CARD_STYLE,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'left',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              <Target size={14} style={{ color: item.color }} /> {item.title}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginTop: 4,
                color: 'var(--text-primary)',
              }}
            >
              {item.words.toLocaleString('pt-BR')}{' '}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
                / {item.goal.toLocaleString('pt-BR')} pal.
              </span>
            </div>
          </div>
          <ProgressRing
            percent={item.percent}
            size={56}
            strokeWidth={5}
            accentColor={item.color}
            animate={motionEnabled}
          />
        </button>
      ))}
    </div>
  );
}
