import { useMemo } from 'react';
import { BookOpen, TrendingUp, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  DASHBOARD_CARD_STYLE,
  DASHBOARD_SUBCARD_STYLE,
  formatIsoDate,
  getVelocityBadge,
  isMotionEnabled,
} from './dashboardTheme';
import {
  WritingMomentumBars,
  type DailyMomentumPoint,
} from './WritingMomentumBars';

interface VelocitySectionCardProps {
  dailyGoal: number;
  selectedDate: string | null;
  onSelectDate: (isoDate: string | null) => void;
}

export function VelocitySectionCard({
  dailyGoal,
  selectedDate,
  onSelectDate,
}: VelocitySectionCardProps) {
  const { project, settings, setActiveView } = useProject();
  const motionEnabled = isMotionEnabled(settings);

  const last30Days: DailyMomentumPoint[] = useMemo(() => {
    const logMap = new Map(project.writingLogs.map((l) => [l.date, l]));
    const entries: DailyMomentumPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const isoDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const log = logMap.get(isoDate);
      entries.push({
        isoDate,
        wordsWritten: log?.wordsWritten ?? 0,
        minutesSpent: log?.minutesSpent ?? 0,
      });
    }
    return entries;
  }, [project.writingLogs]);

  const selectedLog = useMemo(() => {
    if (!selectedDate) return null;
    const found = project.writingLogs.find((l) => l.date === selectedDate);
    return {
      isoDate: selectedDate,
      wordsWritten: found?.wordsWritten ?? 0,
      minutesSpent: found?.minutesSpent ?? 0,
    };
  }, [project.writingLogs, selectedDate]);

  const selectedBadge = selectedLog
    ? getVelocityBadge(selectedLog.wordsWritten, dailyGoal)
    : null;

  return (
    <section className="ig-card-interactive" style={DASHBOARD_CARD_STYLE}>
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
          <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
          Velocidade de Escrita (Últimos 30 Dias)
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Linha tracejada = meta diária ({dailyGoal.toLocaleString('pt-BR')} pal.)
        </span>
      </div>

      <WritingMomentumBars
        days={last30Days}
        dailyGoal={dailyGoal}
        dateFormat={settings.dateFormat}
        chartHeight={124}
        selectedDate={selectedDate}
        onSelectDate={(iso) => onSelectDate(selectedDate === iso ? null : iso)}
        animateBars={motionEnabled}
        showGoalLine
      />

      {selectedLog && selectedBadge && (
        <div
          style={{
            ...DASHBOARD_SUBCARD_STYLE,
            marginTop: 12,
            padding: '9px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              Dia fixado: {formatIsoDate(selectedLog.isoDate, settings.dateFormat)}
            </strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              {selectedLog.wordsWritten.toLocaleString('pt-BR')} palavras ·{' '}
              {selectedLog.minutesSpent} min ·{' '}
              {Math.round((selectedLog.wordsWritten / dailyGoal) * 100)}% da meta
            </span>
            <span
              style={{
                color: selectedBadge.color,
                backgroundColor: selectedBadge.softBg,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {selectedBadge.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveView('manuscript')}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                fontSize: 11.5,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <BookOpen size={12} /> Abrir Manuscrito
            </button>
            <button
              type="button"
              aria-label="Limpar dia selecionado"
              onClick={() => onSelectDate(null)}
              style={{
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 11.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <X size={12} /> Limpar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
