import { useMemo, useState } from 'react';
import { Flame, ArrowUpRight, BookOpen } from 'lucide-react';
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

export function WritingMomentumCard() {
  const { project, settings, setActiveView } = useProject();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const motionEnabled = isMotionEnabled(settings);

  const recentLogs: DailyMomentumPoint[] = useMemo(
    () =>
      project.writingLogs.slice(-14).map((l) => ({
        isoDate: l.date,
        wordsWritten: l.wordsWritten,
        minutesSpent: l.minutesSpent,
      })),
    [project.writingLogs]
  );

  const weekWords = useMemo(
    () => recentLogs.slice(-7).reduce((acc, l) => acc + l.wordsWritten, 0),
    [recentLogs]
  );
  const activeDaysStreak = useMemo(
    () => project.writingLogs.filter((l) => l.wordsWritten > 0).length,
    [project.writingLogs]
  );

  const latestWords = recentLogs[recentLogs.length - 1]?.wordsWritten ?? 0;
  const pinnedDay = useMemo(
    () => recentLogs.find((d) => d.isoDate === selectedDate) ?? null,
    [recentLogs, selectedDate]
  );
  const pinnedBadge = pinnedDay
    ? getVelocityBadge(pinnedDay.wordsWritten, project.dailyWordGoal)
    : null;

  return (
    <section
      className="ig-card-interactive"
      style={{
        ...DASHBOARD_CARD_STYLE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            <Flame size={15} color="#f59e0b" /> Momento de Escrita
          </span>
          <button
            type="button"
            onClick={() => setActiveView('progress')}
            style={{
              background: 'transparent',
              color: '#d97706',
              fontSize: 11.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 4px',
              borderRadius: 4,
            }}
            title="Abrir Rastreador de Progresso"
          >
            {activeDaysStreak}{' '}
            {activeDaysStreak === 1 ? 'dia ativo' : 'dias ativos'}
            <ArrowUpRight size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Último registro</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {latestWords.toLocaleString('pt-BR')}{' '}
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                / {project.dailyWordGoal.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Últimos 7 registros</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success, #10b981)' }}>
              {weekWords.toLocaleString('pt-BR')} palavras
            </div>
          </div>
        </div>

        {recentLogs.length > 0 ? (
          <WritingMomentumBars
            days={recentLogs}
            dailyGoal={project.dailyWordGoal}
            dateFormat={settings.dateFormat}
            chartHeight={52}
            selectedDate={selectedDate}
            onSelectDate={(iso) =>
              setSelectedDate((curr) => (curr === iso ? null : iso))
            }
            animateBars={motionEnabled}
            showGoalLine
          />
        ) : (
          <button
            type="button"
            className="ig-tile-interactive"
            onClick={() => setActiveView('progress')}
            style={{
              ...DASHBOARD_SUBCARD_STYLE,
              width: '100%',
              padding: '12px 10px',
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            Nenhum registro ainda. Clique para iniciar uma sessão no Rastreador.
          </button>
        )}
      </div>

      {pinnedDay && pinnedBadge ? (
        <div
          style={{
            ...DASHBOARD_SUBCARD_STYLE,
            marginTop: 10,
            padding: '8px 10px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 11,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatIsoDate(pinnedDay.isoDate, settings.dateFormat)}
            </strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              {pinnedDay.wordsWritten.toLocaleString('pt-BR')} pal. · {pinnedDay.minutesSpent} min
            </span>
            <span
              style={{
                color: pinnedBadge.color,
                backgroundColor: pinnedBadge.softBg,
                padding: '1px 6px',
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              {pinnedBadge.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setActiveView('manuscript')}
              style={{
                padding: '3px 7px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
                fontSize: 10.5,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <BookOpen size={11} /> Manuscrito
            </button>
            <button
              type="button"
              onClick={() => setActiveView('progress')}
              style={{
                padding: '3px 7px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              Rastreador
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8 }}>
          Passe o mouse ou clique em uma barra para detalhar os últimos 14 registros
        </div>
      )}
    </section>
  );
}
