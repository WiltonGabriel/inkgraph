import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

type BeatOverlay = 'none' | 'three-act' | 'heros-journey' | 'save-the-cat';

const OVERLAY_BEATS: Record<BeatOverlay, { pos: number; label: string }[]> = {
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

export function TensionCurveChart() {
  const { project, activeSceneId, setActiveSceneId, setActiveView, upsertScene } = useProject();
  const [collapsed, setCollapsed] = useState(false);
  const [overlay, setOverlay] = useState<BeatOverlay>('three-act');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const scenes = project.scenes;
  const width = 900;
  const height = 105;

  const updateTensionFromClientY = (svgEl: SVGSVGElement, sceneId: string, clientY: number) => {
    const rect = svgEl.getBoundingClientRect();
    if (!rect.height) return;
    const relY = ((clientY - rect.top) / rect.height) * height;
    const rawPct = ((height - 18 - relY) / (height - 36)) * 100;
    const snapped = Math.max(0, Math.min(100, Math.round(rawPct / 5) * 5));
    const target = scenes.find((s) => s.id === sceneId);
    if (target && target.tension !== snapped) {
      upsertScene({ ...target, tension: snapped });
    }
  };

  const points = scenes.map((s, idx) => {
    const x = scenes.length === 1 ? width / 2 : 45 + (idx / (scenes.length - 1)) * (width - 90);
    const y = height - 18 - (s.tension / 100) * (height - 36);
    return { x, y, scene: s };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div
      style={{
        backgroundColor: '#111622',
        border: '1px solid #242f44',
        borderRadius: 8,
        padding: '8px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={15} color="#ef4444" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#f1f5f9' }}>
            Curva de Tensão Narrativa
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Sobreposição Beat Sheet:</span>
          <select
            value={overlay}
            onChange={(e) => setOverlay(e.target.value as BeatOverlay)}
            style={{
              backgroundColor: '#0a0d14',
              border: '1px solid #242f44',
              borderRadius: 5,
              padding: '3px 8px',
              fontSize: 11.5,
              color: '#f1f5f9',
            }}
          >
            <option value="none">Nenhum</option>
            <option value="three-act">Três Atos</option>
            <option value="heros-journey">Jornada do Herói</option>
            <option value="save-the-cat">Save the Cat</option>
          </select>

          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              background: '#182030',
              border: '1px solid #242f44',
              borderRadius: 5,
              padding: '3px 7px',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          onPointerMove={(e) => {
            if (!draggingId) return;
            updateTensionFromClientY(e.currentTarget, draggingId, e.clientY);
          }}
          onPointerUp={() => setDraggingId(null)}
          onPointerLeave={() => setDraggingId(null)}
          style={{ width: '100%', height: 105, overflow: 'visible', touchAction: 'none' }}
        >
          {OVERLAY_BEATS[overlay].map((b, i) => {
            const bx = 45 + b.pos * (width - 90);
            return (
              <g key={i}>
                <line
                  x1={bx}
                  y1={8}
                  x2={bx}
                  y2={height - 14}
                  stroke="#334155"
                  strokeDasharray="3 3"
                />
                <text x={bx} y={12} fill="#64748b" fontSize={9.5} textAnchor="middle">
                  {b.label}
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <polyline fill="none" stroke="#ef4444" strokeWidth={2.5} points={polyline} />
          )}

          {points.map(({ x, y, scene }) => {
            const active = scene.id === activeSceneId;
            return (
              <g
                key={scene.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setActiveSceneId(scene.id);
                  setDraggingId(scene.id);
                }}
                onDoubleClick={() => {
                  setActiveSceneId(scene.id);
                  setActiveView('manuscript');
                }}
                style={{ cursor: 'ns-resize' }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={active ? 7 : 5}
                  fill={scene.tension > 70 ? '#ef4444' : '#f59e0b'}
                  stroke="#fff"
                  strokeWidth={active ? 2 : 1}
                />
                <text x={x} y={y - 9} fill="#e2e8f0" fontSize={9.5} textAnchor="middle">
                  {scene.tension}%
                </text>
                <text x={x} y={height - 3} fill="#94a3b8" fontSize={9.5} textAnchor="middle">
                  C{scene.chapterNumber}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
