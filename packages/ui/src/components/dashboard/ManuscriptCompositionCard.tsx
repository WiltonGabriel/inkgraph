import { useId, useMemo, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { DASHBOARD_CARD_STYLE, DASHBOARD_SUBCARD_STYLE } from './dashboardTheme';
import { FloatingChartTooltip } from './FloatingChartTooltip';
import {
  buildActBreakdowns,
  buildStatusBreakdowns,
  type CompositionBreakdownItem,
} from './compositionData';
import { CompositionTooltipBody } from './CompositionTooltipBody';

export function ManuscriptCompositionCard() {
  const { project, totalWordCount, setActiveView, setActiveSceneId } = useProject();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const avgWordsPerScene =
    project.scenes.length > 0
      ? Math.round(totalWordCount / project.scenes.length)
      : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWordCount / 220));

  const actBreakdowns = useMemo(
    () => buildActBreakdowns(project.scenes, totalWordCount),
    [project.scenes, totalWordCount]
  );
  const statusBreakdowns = useMemo(
    () => buildStatusBreakdowns(project.scenes, totalWordCount),
    [project.scenes, totalWordCount]
  );

  const activeTip = useMemo(
    () =>
      [...actBreakdowns, ...statusBreakdowns].find((i) => i.key === hoveredKey) ??
      null,
    [actBreakdowns, statusBreakdowns, hoveredKey]
  );

  const cancelLeave = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const scheduleLeave = () => {
    cancelLeave();
    leaveTimerRef.current = window.setTimeout(() => setHoveredKey(null), 90);
  };

  const openSceneInManuscript = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setActiveView('manuscript');
  };

  const handleBreakdownClick = (item: CompositionBreakdownItem) => {
    if (item.scenes.length > 0) setActiveSceneId(item.scenes[0].id);
    setActiveView(item.targetView);
  };

  return (
    <section
      className="ig-card-interactive"
      style={{ ...DASHBOARD_CARD_STYLE, position: 'relative' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setHoveredKey(null);
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--text-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Layers size={15} style={{ color: 'var(--accent-primary)' }} />
          Composição do Manuscrito
        </h3>
        <button
          type="button"
          onClick={() => setActiveView('plotboard')}
          style={{
            background: 'transparent',
            color: 'var(--accent-primary)',
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          Ver Quadro
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          className="ig-tile-interactive"
          onClick={() => setActiveView('plotboard')}
          style={{ ...DASHBOARD_SUBCARD_STYLE, padding: 10, textAlign: 'left' }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cenas</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {project.scenes.length}
          </div>
        </button>
        <button
          type="button"
          className="ig-tile-interactive"
          onClick={() => setActiveView('manuscript')}
          style={{ ...DASHBOARD_SUBCARD_STYLE, padding: 10, textAlign: 'left' }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Média / cena</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>
            {avgWordsPerScene.toLocaleString('pt-BR')} pal.
          </div>
        </button>
        <button
          type="button"
          className="ig-tile-interactive"
          onClick={() => setActiveView('preview')}
          style={{ ...DASHBOARD_SUBCARD_STYLE, padding: 10, textAlign: 'left' }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tempo de leitura</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success, #10b981)' }}>
            ~{readingTimeMinutes} min
          </div>
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <FloatingChartTooltip
          id={tooltipId}
          visible={activeTip !== null}
          xPercent={activeTip?.xPercent ?? 50}
          minWidth={225}
          maxWidth={290}
          interactive
          onMouseEnter={cancelLeave}
          onMouseLeave={scheduleLeave}
        >
          {activeTip && (
            <CompositionTooltipBody
              item={activeTip}
              onOpenScene={openSceneInManuscript}
            />
          )}
        </FloatingChartTooltip>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-secondary)',
              marginBottom: 5,
            }}
          >
            <span>Distribuição por Ato</span>
            <span style={{ color: 'var(--text-muted)' }}>Clique para abrir Quadro</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 4,
              height: 16,
              padding: 2,
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {actBreakdowns.map((item) => {
              const weight = Math.max(12, item.pctManuscript || (item.scenes.length > 0 ? 18 : 10));
              const isHovered = hoveredKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-label={`${item.title}: ${item.scenes.length} cenas, ${item.words} palavras, ${item.pctManuscript}%`}
                  aria-describedby={isHovered ? tooltipId : undefined}
                  onMouseEnter={() => {
                    cancelLeave();
                    setHoveredKey(item.key);
                  }}
                  onMouseLeave={scheduleLeave}
                  onFocus={() => {
                    cancelLeave();
                    setHoveredKey(item.key);
                  }}
                  onBlur={() => setHoveredKey((c) => (c === item.key ? null : c))}
                  onClick={() => handleBreakdownClick(item)}
                  style={{
                    flexGrow: weight,
                    flexBasis: 0,
                    height: '100%',
                    borderRadius: 4,
                    backgroundColor: item.scenes.length > 0 ? item.color : 'var(--bg-hover)',
                    opacity: item.scenes.length > 0 ? (isHovered ? 1 : 0.85) : 0.45,
                    outline: isHovered ? '2px solid var(--text-primary)' : 'none',
                    color: '#ffffff',
                    fontSize: 9.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    padding: '0 4px',
                  }}
                >
                  {item.subtitle}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', fontSize: 11.5 }}>
          {statusBreakdowns.map((item) => {
            const isHovered = hoveredKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className="ig-tile-interactive"
                aria-label={`${item.title}: ${item.scenes.length} cenas, ${item.words} palavras, ${item.pctManuscript}%`}
                aria-describedby={isHovered ? tooltipId : undefined}
                onMouseEnter={() => {
                  cancelLeave();
                  setHoveredKey(item.key);
                }}
                onMouseLeave={scheduleLeave}
                onFocus={() => {
                  cancelLeave();
                  setHoveredKey(item.key);
                }}
                onBlur={() => setHoveredKey((c) => (c === item.key ? null : c))}
                onClick={() => handleBreakdownClick(item)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: isHovered ? item.softBg : 'var(--bg-elevated)',
                  border: `1px solid ${isHovered ? item.color : 'var(--border-subtle)'}`,
                  color: item.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11.5,
                }}
              >
                <span>{item.subtitle}:</span>
                <strong>{item.scenes.length}</strong>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
