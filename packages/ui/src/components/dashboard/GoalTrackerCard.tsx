import { useId, useMemo, useState } from 'react';
import { ArrowUpRight, Target } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { DASHBOARD_CARD_STYLE, isMotionEnabled } from './dashboardTheme';
import { ProgressRing } from './ProgressRing';
import { FloatingChartTooltip } from './FloatingChartTooltip';
import { GoalEditForm } from './GoalEditForm';

export function GoalTrackerCard() {
  const { project, updateProject, totalWordCount, settings, setActiveView } =
    useProject();
  const [editingGoal, setEditingGoal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipId = useId();
  const motionEnabled = isMotionEnabled(settings);

  const wordGoalPercent = Math.min(
    100,
    Math.round((totalWordCount / Math.max(1, project.wordCountGoal)) * 100)
  );
  const wordsRemaining = Math.max(0, project.wordCountGoal - totalWordCount);

  const daysLeft = useMemo(() => {
    if (!project.deadline) return null;
    const diff =
      new Date(project.deadline).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / 86400000);
  }, [project.deadline]);

  const requiredPacePerDay =
    daysLeft && daysLeft > 0 ? Math.ceil(wordsRemaining / daysLeft) : null;
  const daysAtDailyGoal =
    project.dailyWordGoal > 0
      ? Math.ceil(wordsRemaining / project.dailyWordGoal)
      : null;

  return (
    <section
      className="ig-card-interactive"
      style={{ ...DASHBOARD_CARD_STYLE, position: 'relative' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setShowTooltip(false);
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
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
          <Target size={15} style={{ color: 'var(--accent-primary)' }} /> Metas do Projeto
        </span>
        <button
          type="button"
          className="ig-tile-interactive"
          aria-expanded={editingGoal}
          onClick={() => setEditingGoal((v) => !v)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '3px 9px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {editingGoal ? 'Fechar' : 'Editar meta'}
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <FloatingChartTooltip
          id={tooltipId}
          visible={showTooltip}
          xPercent={50}
          minWidth={230}
          maxWidth={290}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              Progresso Geral ({wordGoalPercent}%)
            </strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Escrito:</span>
              <strong>{totalWordCount.toLocaleString('pt-BR')} pal.</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Meta diária / semanal:</span>
              <strong>
                {project.dailyWordGoal.toLocaleString('pt-BR')} /{' '}
                {project.weeklyWordGoal.toLocaleString('pt-BR')}
              </strong>
            </div>
            {daysAtDailyGoal !== null && wordsRemaining > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Projeção atual:</span>
                <strong style={{ color: 'var(--accent-primary)' }}>
                  ~{daysAtDailyGoal} dias no ritmo diário
                </strong>
              </div>
            )}
            <div style={{ fontSize: 10.5, color: 'var(--accent-primary)', paddingTop: 2 }}>
              Clique para abrir o Rastreador de Progresso
            </div>
          </div>
        </FloatingChartTooltip>

        <button
          type="button"
          className="ig-tile-interactive"
          aria-describedby={showTooltip ? tooltipId : undefined}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          onClick={() => setActiveView('progress')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 10,
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'left',
          }}
        >
          <ProgressRing
            percent={wordGoalPercent}
            size={64}
            strokeWidth={5}
            animate={motionEnabled}
            ariaLabel={`Meta do projeto: ${wordGoalPercent}%`}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {totalWordCount.toLocaleString('pt-BR')}{' '}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                  / {project.wordCountGoal.toLocaleString('pt-BR')} pal.
                </span>
              </div>
              <ArrowUpRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>
              {wordsRemaining.toLocaleString('pt-BR')} palavras restantes
            </div>

            <div
              style={{
                marginTop: 6,
                height: 5,
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${wordGoalPercent}%`,
                  height: '100%',
                  backgroundColor:
                    wordGoalPercent >= 100
                      ? 'var(--success, #10b981)'
                      : 'var(--accent-primary)',
                  borderRadius: 999,
                  transition: motionEnabled ? 'width 280ms ease' : undefined,
                }}
              />
            </div>

            <div style={{ fontSize: 11, color: 'var(--success, #10b981)', marginTop: 5 }}>
              {daysLeft !== null
                ? daysLeft > 0
                  ? `${daysLeft} dias restantes · Ritmo: ~${requiredPacePerDay} pal./dia`
                  : 'Prazo final atingido'
                : 'Sem prazo definido'}
            </div>
          </div>
        </button>
      </div>

      {editingGoal && (
        <GoalEditForm
          wordCountGoal={project.wordCountGoal}
          deadline={project.deadline}
          onSave={(wordCountGoal, deadline) => {
            updateProject((prev) => ({ ...prev, wordCountGoal, deadline }));
            setEditingGoal(false);
          }}
        />
      )}
    </section>
  );
}
