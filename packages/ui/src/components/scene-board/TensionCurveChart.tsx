import { useId, useMemo, useRef, useState } from 'react';
import { Activity, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { InteractiveChartStyles } from '../dashboard/InteractiveChartStyles';
import { FloatingChartTooltip } from '../dashboard/FloatingChartTooltip';
import { isMotionEnabled } from '../dashboard/dashboardTheme';
import {
  TensionCurveSvg,
  type BeatOverlayMode,
  type TensionPoint,
} from '../dashboard/TensionCurveSvg';
import {
  TensionTooltipCard,
  getTensionColor,
} from '../dashboard/TensionTooltipCard';

export function TensionCurveChart() {
  const { project, settings, activeSceneId, setActiveSceneId, setActiveView } =
    useProject();
  const [collapsed, setCollapsed] = useState(false);
  const [overlay, setOverlay] = useState<BeatOverlayMode>('three-act');
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  const tooltipId = useId();
  const overlaySelectId = useId();
  const motionEnabled = isMotionEnabled(settings);

  const scenes = project.scenes;
  const width = 900;
  const height = 112;

  const characterMap = useMemo(
    () => new Map(project.characters.map((c) => [c.id, c.name])),
    [project.characters]
  );

  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of project.worlds) {
      for (const loc of w.locations) {
        map.set(loc.id, loc.name);
      }
    }
    return map;
  }, [project.worlds]);

  const points = useMemo<TensionPoint[]>(
    () =>
      scenes.map((s, idx) => {
        const x =
          scenes.length === 1
            ? width / 2
            : 45 + (idx / (scenes.length - 1)) * (width - 90);
        const clampedTension = Math.max(0, Math.min(100, s.tension));
        const y = height - 20 - (clampedTension / 100) * (height - 40);
        return { x, y, scene: s };
      }),
    [scenes]
  );

  const hoveredPoint = points.find((p) => p.scene.id === hoveredSceneId) ?? null;
  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? null;

  const cancelLeave = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const scheduleLeave = () => {
    cancelLeave();
    leaveTimerRef.current = window.setTimeout(() => setHoveredSceneId(null), 100);
  };

  const openSceneInManuscript = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setActiveView('manuscript');
  };

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: 'var(--card-shadow, none)',
        position: 'relative',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setHoveredSceneId(null);
      }}
    >
      <InteractiveChartStyles />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={15} style={{ color: 'var(--danger, #ef4444)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              Curva de Tensão Narrativa
            </span>
          </div>

          {activeScene && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 999,
                padding: '2px 4px 2px 9px',
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                #Cap {activeScene.chapterNumber}
              </span>
              <span
                style={{
                  maxWidth: 190,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeScene.title}
              </span>
              <span style={{ color: getTensionColor(activeScene.tension), fontWeight: 700 }}>
                {activeScene.tension}%
              </span>
              <button
                type="button"
                onClick={() => openSceneInManuscript(activeScene.id)}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <BookOpen size={10} /> Abrir Cena
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor={overlaySelectId}
            style={{ fontSize: 11, color: 'var(--text-secondary)' }}
          >
            Sobreposição Beat Sheet:
          </label>
          <select
            id={overlaySelectId}
            value={overlay}
            onChange={(e) => setOverlay(e.target.value as BeatOverlayMode)}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '3px 8px',
              fontSize: 11.5,
              color: 'var(--text-primary)',
            }}
          >
            <option value="none">Nenhum</option>
            <option value="three-act">Três Atos</option>
            <option value="heros-journey">Jornada do Herói</option>
            <option value="save-the-cat">Save the Cat</option>
          </select>

          <button
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expandir curva de tensão' : 'Recolher curva de tensão'}
            onClick={() => setCollapsed((c) => !c)}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '4px 7px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ position: 'relative' }}>
          <FloatingChartTooltip
            id={tooltipId}
            visible={hoveredPoint !== null}
            xPercent={hoveredPoint ? (hoveredPoint.x / width) * 100 : 50}
            placement="top"
            minWidth={240}
            maxWidth={310}
            interactive
            onMouseEnter={cancelLeave}
            onMouseLeave={scheduleLeave}
          >
            {hoveredPoint && (
              <TensionTooltipCard
                scene={hoveredPoint.scene}
                povName={
                  hoveredPoint.scene.povCharacterId
                    ? characterMap.get(hoveredPoint.scene.povCharacterId)
                    : undefined
                }
                locationName={
                  hoveredPoint.scene.locationId
                    ? locationMap.get(hoveredPoint.scene.locationId)
                    : undefined
                }
                onOpenScene={openSceneInManuscript}
              />
            )}
          </FloatingChartTooltip>

          {scenes.length === 0 ? (
            <div
              style={{
                padding: '14px 12px',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              Nenhuma cena registrada para traçar a curva de tensão.
            </div>
          ) : (
            <TensionCurveSvg
              width={width}
              height={height}
              points={points}
              overlay={overlay}
              activeSceneId={activeSceneId}
              hoveredSceneId={hoveredSceneId}
              tooltipId={tooltipId}
              motionEnabled={motionEnabled}
              characterMap={characterMap}
              onHoverScene={(sceneId) => {
                cancelLeave();
                setHoveredSceneId(sceneId);
              }}
              onScheduleLeave={scheduleLeave}
              onSelectScene={setActiveSceneId}
              onOpenScene={openSceneInManuscript}
            />
          )}
        </div>
      )}
    </section>
  );
}
