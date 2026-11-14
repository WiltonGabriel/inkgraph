import { useId, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import type { AppSettings, WritingLogEntry } from '../../types/project';
import {
  DASHBOARD_CARD_STYLE,
  formatIsoDate,
  getVelocityBadge,
} from './dashboardTheme';
import { FloatingChartTooltip } from './FloatingChartTooltip';

interface ActivityHeatmapCardProps {
  writingLogs: WritingLogEntry[];
  dailyWordGoal: number;
  dateFormat: AppSettings['dateFormat'];
  selectedDate: string | null;
  onSelectDate: (isoDate: string) => void;
}

export function ActivityHeatmapCard({
  writingLogs,
  dailyWordGoal,
  dateFormat,
  selectedDate,
  onSelectDate,
}: ActivityHeatmapCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const tooltipId = useId();
  const safeGoal = Math.max(1, dailyWordGoal);

  const heatmap84Days = useMemo(() => {
    const logByDate = new Map(writingLogs.map((l) => [l.date, l]));
    const cells: { isoDate: string; words: number; minutes: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const isoDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const log = logByDate.get(isoDate);
      cells.push({
        isoDate,
        words: log?.wordsWritten ?? 0,
        minutes: log?.minutesSpent ?? 0,
      });
    }
    return cells;
  }, [writingLogs]);

  const hoveredCell = hoveredIdx !== null ? heatmap84Days[hoveredIdx] ?? null : null;
  const hoveredBadge = hoveredCell
    ? getVelocityBadge(hoveredCell.words, safeGoal)
    : null;
  const hoveredXPercent =
    hoveredIdx !== null ? (((hoveredIdx % 12) + 0.5) / 12) * 100 : 50;

  return (
    <section
      className="ig-card-interactive"
      style={{
        ...DASHBOARD_CARD_STYLE,
        position: 'relative',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setHoveredIdx(null);
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          <Calendar size={15} style={{ color: 'var(--success, #10b981)' }} />
          Mapa de Calor de Atividade (12 Semanas)
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10.5,
            color: 'var(--text-muted)',
          }}
        >
          <span>Menos</span>
          {[0, 0.32, 0.62, 1].map((intensity, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor:
                  intensity === 0
                    ? 'var(--bg-elevated)'
                    : `color-mix(in srgb, var(--success, #10b981) ${Math.round(intensity * 100)}%, var(--bg-elevated))`,
                border: '1px solid var(--border-subtle)',
              }}
            />
          ))}
          <span>Mais</span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <FloatingChartTooltip
          id={tooltipId}
          visible={hoveredCell !== null && hoveredBadge !== null}
          xPercent={hoveredXPercent}
          minWidth={205}
          maxWidth={260}
        >
          {hoveredCell && hoveredBadge && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{formatIsoDate(hoveredCell.isoDate, dateFormat)}</strong>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: hoveredBadge.color,
                    backgroundColor: hoveredBadge.softBg,
                    padding: '1px 6px',
                    borderRadius: 999,
                  }}
                >
                  {hoveredBadge.label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Palavras:</span>
                <strong>{hoveredCell.words.toLocaleString('pt-BR')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tempo / Meta:</span>
                <strong>
                  {hoveredCell.minutes} min ·{' '}
                  {Math.round((hoveredCell.words / safeGoal) * 100)}%
                </strong>
              </div>
            </div>
          )}
        </FloatingChartTooltip>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
            gap: 5,
          }}
        >
          {heatmap84Days.map((cell, idx) => {
            const ratio = cell.words / safeGoal;
            const bg =
              cell.words <= 0
                ? 'var(--bg-elevated)'
                : ratio < 0.5
                  ? 'color-mix(in srgb, var(--success, #10b981) 34%, var(--bg-elevated))'
                  : ratio < 1
                    ? 'color-mix(in srgb, var(--success, #10b981) 66%, var(--bg-elevated))'
                    : 'var(--success, #10b981)';
            const isSelected = selectedDate === cell.isoDate;
            const isHovered = hoveredIdx === idx;

            return (
              <button
                key={cell.isoDate}
                type="button"
                aria-label={`${formatIsoDate(cell.isoDate, dateFormat)}: ${cell.words} palavras, ${cell.minutes} minutos`}
                aria-pressed={isSelected}
                aria-describedby={isHovered ? tooltipId : undefined}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx((c) => (c === idx ? null : c))}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx((c) => (c === idx ? null : c))}
                onClick={() => onSelectDate(cell.isoDate)}
                style={{
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: bg,
                  border: isSelected
                    ? '2px solid var(--accent-primary)'
                    : isHovered
                      ? '1px solid var(--text-primary)'
                      : '1px solid var(--border-subtle)',
                  padding: 0,
                  transition: 'border-color 120ms ease, background-color 140ms ease',
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
