import { useId, useRef, useState, type CSSProperties } from 'react';
import type { AppSettings } from '../../types/project';
import {
  formatIsoDate,
  formatShortDate,
  getVelocityBadge,
} from './dashboardTheme';
import { FloatingChartTooltip } from './FloatingChartTooltip';

export interface DailyMomentumPoint {
  isoDate: string;
  wordsWritten: number;
  minutesSpent: number;
}

interface WritingMomentumBarsProps {
  days: DailyMomentumPoint[];
  dailyGoal: number;
  dateFormat: AppSettings['dateFormat'];
  chartHeight?: number;
  selectedDate: string | null;
  onSelectDate: (isoDate: string) => void;
  animateBars: boolean;
  showGoalLine?: boolean;
}

export function WritingMomentumBars({
  days,
  dailyGoal,
  dateFormat,
  chartHeight = 56,
  selectedDate,
  onSelectDate,
  animateBars,
  showGoalLine = false,
}: WritingMomentumBarsProps) {
  const tooltipId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  const safeGoal = Math.max(1, dailyGoal);
  const maxVal = Math.max(safeGoal, ...days.map((d) => d.wordsWritten), 1);
  const goalLinePct = Math.min(100, Math.round((safeGoal / maxVal) * 100));

  const cancelLeave = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const scheduleLeave = () => {
    cancelLeave();
    leaveTimerRef.current = window.setTimeout(() => {
      setHoveredIdx(null);
    }, 90);
  };

  const hoveredDay = hoveredIdx !== null ? days[hoveredIdx] ?? null : null;
  const hoveredPct =
    hoveredDay && days.length > 0
      ? Math.round((hoveredDay.wordsWritten / safeGoal) * 100)
      : 0;
  const hoveredBadge = hoveredDay
    ? getVelocityBadge(hoveredDay.wordsWritten, safeGoal)
    : null;
  const hoveredXPercent =
    hoveredIdx !== null && days.length > 0
      ? ((hoveredIdx + 0.5) / days.length) * 100
      : 50;

  return (
    <div
      style={{ position: 'relative' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setHoveredIdx(null);
      }}
    >
      <FloatingChartTooltip
        id={tooltipId}
        visible={hoveredDay !== null && hoveredBadge !== null}
        xPercent={hoveredXPercent}
        interactive
        onMouseEnter={cancelLeave}
        onMouseLeave={scheduleLeave}
      >
        {hoveredDay && hoveredBadge && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                {formatIsoDate(hoveredDay.isoDate, dateFormat)}
              </strong>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: hoveredBadge.color,
                  backgroundColor: hoveredBadge.softBg,
                  padding: '1px 7px',
                  borderRadius: 999,
                }}
              >
                {hoveredBadge.label}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Palavras:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {hoveredDay.wordsWritten.toLocaleString('pt-BR')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tempo:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {hoveredDay.minutesSpent} min
                {hoveredDay.minutesSpent > 0 && hoveredDay.wordsWritten > 0
                  ? ` (${Math.round(hoveredDay.wordsWritten / hoveredDay.minutesSpent)} pal./min)`
                  : ''}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Meta diária:</span>
              <strong style={{ color: hoveredBadge.color }}>
                {hoveredPct}% de {safeGoal.toLocaleString('pt-BR')}
              </strong>
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 4,
              }}
            >
              Clique na barra para {selectedDate === hoveredDay.isoDate ? 'desafixar' : 'fixar'} o dia
            </div>
          </div>
        )}
      </FloatingChartTooltip>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: days.length > 20 ? 3 : 4,
          height: chartHeight,
          paddingTop: 6,
        }}
      >
        {showGoalLine && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${goalLinePct}%`,
              borderTop: '1px dashed color-mix(in srgb, var(--success, #10b981) 55%, transparent)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {days.map((day, idx) => {
          const heightPct =
            day.wordsWritten > 0
              ? Math.max(10, Math.min(100, Math.round((day.wordsWritten / maxVal) * 100)))
              : 8;
          const isHovered = hoveredIdx === idx;
          const isPinned = selectedDate === day.isoDate;
          const metGoal = day.wordsWritten >= safeGoal;
          const barColor = metGoal
            ? 'var(--success, #10b981)'
            : day.wordsWritten > 0
              ? 'var(--accent-primary)'
              : 'var(--bg-hover)';

          const barStyle: CSSProperties & { '--ig-bar-delay'?: string } = {
            width: '100%',
            height: `${heightPct}%`,
            backgroundColor: barColor,
            borderRadius: '3px 3px 2px 2px',
            outline: isPinned
              ? '2px solid var(--accent-primary)'
              : isHovered
                ? '1px solid var(--text-primary)'
                : 'none',
            outlineOffset: isPinned ? 1 : 0,
            opacity:
              hoveredIdx !== null && !isHovered && !isPinned ? 0.62 : 1,
            transition: 'opacity 140ms ease, background-color 140ms ease',
            '--ig-bar-delay': `${Math.min(idx * 16, 260)}ms`,
          };

          const labelDate = formatIsoDate(day.isoDate, dateFormat);
          const goalPct = Math.round((day.wordsWritten / safeGoal) * 100);

          return (
            <button
              key={day.isoDate}
              type="button"
              className="ig-bar-btn"
              aria-label={`${labelDate}: ${day.wordsWritten} palavras, ${day.minutesSpent} minutos, ${goalPct}% da meta`}
              aria-pressed={isPinned}
              aria-describedby={isHovered ? tooltipId : undefined}
              onMouseEnter={() => {
                cancelLeave();
                setHoveredIdx(idx);
              }}
              onMouseLeave={scheduleLeave}
              onFocus={() => {
                cancelLeave();
                setHoveredIdx(idx);
              }}
              onBlur={() => setHoveredIdx((curr) => (curr === idx ? null : curr))}
              onClick={() => onSelectDate(day.isoDate)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                background: 'transparent',
                padding: 0,
                borderRadius: 3,
                position: 'relative',
                zIndex: isHovered || isPinned ? 3 : 2,
              }}
            >
              <span
                className={animateBars ? 'ig-bar-grow' : undefined}
                style={barStyle}
              />
            </button>
          );
        })}
      </div>

      {days.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: 'var(--text-muted)',
            marginTop: 5,
          }}
        >
          <span>{formatShortDate(days[0].isoDate, dateFormat)}</span>
          <span>{formatShortDate(days[days.length - 1].isoDate, dateFormat)}</span>
        </div>
      )}
    </div>
  );
}
