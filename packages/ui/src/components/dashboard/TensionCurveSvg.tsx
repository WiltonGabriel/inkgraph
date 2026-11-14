import { useId } from 'react';
import type { Scene } from '../../types/project';
import { getTensionColor } from './TensionTooltipCard';

export interface TensionPoint {
  x: number;
  y: number;
  scene: Scene;
}

export type BeatOverlayMode = 'none' | 'three-act' | 'heros-journey' | 'save-the-cat';

const OVERLAY_BEATS: Record<BeatOverlayMode, { pos: number; label: string }[]> = {
  none: [],
  'three-act': [
    { pos: 0.12, label: 'Incidente Incitante' },
    { pos: 0.25, label: 'Fim do Ato I' },
    { pos: 0.5, label: 'Ponto Médio' },
    { pos: 0.75, label: 'Fim do Ato II' },
    { pos: 0.9, label: 'Clímax' },
  ],
  'heros-journey': [
    { pos: 0.15, label: 'Chamado à Aventura' },
    { pos: 0.3, label: 'Travessia do Limiar' },
    { pos: 0.55, label: 'Provação Suprema' },
    { pos: 0.85, label: 'Ressurreição' },
  ],
  'save-the-cat': [
    { pos: 0.1, label: 'Catalisador' },
    { pos: 0.2, label: 'Passagem ao Ato II' },
    { pos: 0.5, label: 'Ponto Médio' },
    { pos: 0.75, label: 'Tudo Está Perdido' },
    { pos: 0.88, label: 'Final' },
  ],
};

interface TensionCurveSvgProps {
  width: number;
  height: number;
  points: TensionPoint[];
  overlay: BeatOverlayMode;
  activeSceneId: string;
  hoveredSceneId: string | null;
  tooltipId: string;
  motionEnabled: boolean;
  characterMap: Map<string, string>;
  onHoverScene: (sceneId: string | null) => void;
  onScheduleLeave: () => void;
  onSelectScene: (sceneId: string) => void;
  onOpenScene: (sceneId: string) => void;
}

export function TensionCurveSvg({
  width,
  height,
  points,
  overlay,
  activeSceneId,
  hoveredSceneId,
  tooltipId,
  motionEnabled,
  characterMap,
  onHoverScene,
  onScheduleLeave,
  onSelectScene,
  onOpenScene,
}: TensionCurveSvgProps) {
  const gradientId = useId();
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPolygon =
    points.length > 1
      ? `${points[0].x},${height - 16} ${polyline} ${points[points.length - 1].x},${height - 16}`
      : '';
  const crosshairPoint =
    points.find((p) => p.scene.id === hoveredSceneId) ??
    points.find((p) => p.scene.id === activeSceneId) ??
    null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 112, overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--danger, #ef4444)" stopOpacity={0.22} />
          <stop offset="100%" stopColor="var(--danger, #ef4444)" stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {[25, 50, 75].map((pct) => {
        const gy = height - 20 - (pct / 100) * (height - 40);
        return (
          <line
            key={pct}
            x1={32}
            y1={gy}
            x2={width - 32}
            y2={gy}
            stroke="var(--border-subtle)"
            strokeOpacity={0.45}
            strokeWidth={1}
          />
        );
      })}

      {OVERLAY_BEATS[overlay].map((b, i) => {
        const bx = 45 + b.pos * (width - 90);
        return (
          <g key={i}>
            <line
              x1={bx}
              y1={12}
              x2={bx}
              y2={height - 16}
              stroke="var(--border-subtle)"
              strokeDasharray="3 3"
            />
            <text x={bx} y={10} fill="var(--text-muted)" fontSize={9.5} textAnchor="middle">
              {b.label}
            </text>
          </g>
        );
      })}

      {points.length > 1 && (
        <>
          <polygon points={areaPolygon} fill={`url(#${gradientId})`} />
          <polyline
            className="ig-tension-polyline"
            fill="none"
            stroke="var(--danger, #ef4444)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polyline}
          />
        </>
      )}

      {crosshairPoint && (
        <line
          x1={crosshairPoint.x}
          y1={14}
          x2={crosshairPoint.x}
          y2={height - 16}
          stroke="var(--accent-primary)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          opacity={hoveredSceneId ? 0.85 : 0.45}
        />
      )}

      {points.map(({ x, y, scene }) => {
        const active = scene.id === activeSceneId;
        const hovered = scene.id === hoveredSceneId;
        const dotColor = getTensionColor(scene.tension);
        const povName = scene.povCharacterId ? characterMap.get(scene.povCharacterId) : undefined;

        return (
          <g
            key={scene.id}
            className="ig-tension-node"
            tabIndex={0}
            role="button"
            aria-label={`Capítulo ${scene.chapterNumber}: ${scene.title}, Tensão ${scene.tension}%${povName ? `, POV ${povName}` : ''}`}
            aria-pressed={active}
            aria-describedby={hovered ? tooltipId : undefined}
            onMouseEnter={() => onHoverScene(scene.id)}
            onMouseLeave={onScheduleLeave}
            onFocus={() => onHoverScene(scene.id)}
            onBlur={() => {
              if (hovered) onHoverScene(null);
            }}
            onClick={() => onSelectScene(scene.id)}
            onDoubleClick={() => onOpenScene(scene.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectScene(scene.id);
              }
            }}
          >
            <circle cx={x} cy={y} r={14} fill="transparent" />
            {(hovered || active) && (
              <circle
                cx={x}
                cy={y}
                r={hovered ? 12 : 9.5}
                fill={dotColor}
                opacity={hovered ? 0.28 : 0.2}
                stroke={dotColor}
                strokeWidth={1}
                className={motionEnabled ? 'ig-tension-aura-pulse' : undefined}
              />
            )}
            <circle
              className="ig-tension-focus-ring"
              cx={x}
              cy={y}
              r={11}
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth={2}
            />
            <circle
              className="ig-tension-dot"
              cx={x}
              cy={y}
              r={hovered ? 7 : active ? 6 : 4.5}
              fill={dotColor}
              stroke="var(--bg-surface)"
              strokeWidth={active || hovered ? 2.2 : 1.5}
            />
            <text
              x={x}
              y={y - 10}
              fill={hovered || active ? 'var(--text-primary)' : 'var(--text-secondary)'}
              fontSize={hovered || active ? 10 : 9.5}
              fontWeight={hovered || active ? 700 : 500}
              textAnchor="middle"
            >
              {scene.tension}%
            </text>
            <text
              x={x}
              y={height - 3}
              fill={hovered || active ? 'var(--accent-primary)' : 'var(--text-muted)'}
              fontSize={9.5}
              fontWeight={hovered || active ? 700 : 500}
              textAnchor="middle"
            >
              C{scene.chapterNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
