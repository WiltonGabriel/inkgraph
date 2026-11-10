import { useState } from 'react';
import { Grid, Link2, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { PlotConnectionType, Scene } from '../../types/project';

interface PlotCanvas2DProps {
  selectedSubplotId: string | null;
}

const CONN_COLORS: Record<PlotConnectionType, string> = {
  'cause-effect': '#ef4444',
  'character-arc': '#3b82f6',
  parallel: '#a855f7',
  subplot: '#10b981',
  temporal: '#f59e0b',
};

const CONN_LABELS: Record<PlotConnectionType, string> = {
  'cause-effect': 'Causa e Efeito',
  'character-arc': 'Arco de Personagem',
  parallel: 'Paralelo',
  subplot: 'Subtrama',
  temporal: 'Temporal',
};

export function PlotCanvas2D({ selectedSubplotId }: PlotCanvas2DProps) {
  const { project, activeSceneId, setActiveSceneId, upsertScene, upsertPlotConnection, deletePlotConnection } =
    useProject();

  const scenes = project.scenes.filter(
    (s) => !selectedSubplotId || s.subplotIds.includes(selectedSubplotId)
  );

  const [fromId, setFromId] = useState(scenes[0]?.id ?? '');
  const [toId, setToId] = useState(scenes[1]?.id ?? '');
  const [connType, setConnType] = useState<PlotConnectionType>('cause-effect');
  const [connLabel, setConnLabel] = useState('');

  const nudgeScene = (scene: Scene, dx: number, dy: number) => {
    upsertScene({
      ...scene,
      position: {
        x: Math.max(20, scene.position.x + dx),
        y: Math.max(20, scene.position.y + dy),
      },
    });
  };

  const snapToGrid = () => {
    scenes.forEach((s, idx) => {
      upsertScene({
        ...s,
        position: { x: 60 + (idx % 4) * 260, y: 60 + Math.floor(idx / 4) * 160 },
      });
    });
  };

  const handleAddConnection = () => {
    if (!fromId || !toId || fromId === toId) return;
    upsertPlotConnection({
      id: `pconn_${Date.now()}`,
      fromSceneId: fromId,
      toSceneId: toId,
      type: connType,
      label: connLabel.trim() || CONN_LABELS[connType],
    });
    setConnLabel('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: '#111622',
          border: '1px solid #242f44',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link2 size={14} color="#6366f1" />
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} style={selectStyle}>
            <option value="">Origem...</option>
            {project.scenes.map((s) => (
              <option key={s.id} value={s.id}>#{s.chapterNumber} {s.title}</option>
            ))}
          </select>
          <span style={{ color: '#64748b', fontSize: 12 }}>→</span>
          <select value={toId} onChange={(e) => setToId(e.target.value)} style={selectStyle}>
            <option value="">Destino...</option>
            {project.scenes.map((s) => (
              <option key={s.id} value={s.id}>#{s.chapterNumber} {s.title}</option>
            ))}
          </select>
          <select
            value={connType}
            onChange={(e) => setConnType(e.target.value as PlotConnectionType)}
            style={selectStyle}
          >
            {Object.entries(CONN_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            placeholder="Rótulo opcional..."
            value={connLabel}
            onChange={(e) => setConnLabel(e.target.value)}
            style={{ ...selectStyle, width: 130 }}
          />
          <button onClick={handleAddConnection} style={btnStyle}>Conectar</button>
        </div>

        <button onClick={snapToGrid} style={{ ...btnStyle, backgroundColor: '#1e293b' }}>
          <Grid size={13} /> Ajustar à grade
        </button>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          backgroundColor: '#0b0f18',
          border: '1px solid #242f44',
          borderRadius: 8,
          overflow: 'auto',
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, width: 1400, height: 800, pointerEvents: 'none' }}>
          <defs>
            <marker id="arrowPlot" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
            </marker>
          </defs>
          {project.plotConnections.map((conn) => {
            const from = project.scenes.find((s) => s.id === conn.fromSceneId);
            const to = project.scenes.find((s) => s.id === conn.toSceneId);
            if (!from || !to) return null;
            const x1 = from.position.x + 105;
            const y1 = from.position.y + 45;
            const x2 = to.position.x + 105;
            const y2 = to.position.y + 45;
            const color = CONN_COLORS[conn.type];
            return (
              <g key={conn.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={2}
                  markerEnd="url(#arrowPlot)"
                />
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} fill={color} fontSize={10} textAnchor="middle">
                  {conn.label || CONN_LABELS[conn.type]}
                </text>
              </g>
            );
          })}
        </svg>

        {scenes.map((scene) => {
          const isSelected = scene.id === activeSceneId;
          return (
            <div
              key={scene.id}
              onClick={() => setActiveSceneId(scene.id)}
              style={{
                position: 'absolute',
                left: scene.position.x,
                top: scene.position.y,
                width: 210,
                padding: 10,
                borderRadius: 7,
                backgroundColor: isSelected ? '#182030' : '#111622',
                border: `1.5px solid ${isSelected ? '#6366f1' : '#242f44'}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                #{scene.chapterNumber} {scene.title}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                Ato {scene.act} • Tensão {scene.tension}%
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  <button onClick={() => nudgeScene(scene, -30, 0)} style={nudgeBtnStyle}>←</button>
                  <button onClick={() => nudgeScene(scene, 0, -30)} style={nudgeBtnStyle}>↑</button>
                  <button onClick={() => nudgeScene(scene, 0, 30)} style={nudgeBtnStyle}>↓</button>
                  <button onClick={() => nudgeScene(scene, 30, 0)} style={nudgeBtnStyle}>→</button>
                </div>
                {project.plotConnections
                  .filter((c) => c.fromSceneId === scene.id)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlotConnection(c.id);
                      }}
                      title="Remover conexão de saída"
                      style={{ background: 'transparent', color: '#ef4444', padding: 2 }}
                    >
                      <Trash2 size={11} />
                    </button>
                  ))}
              </div>
            </div>
          );
        })}

        {/* PlotMinimap SVG Overview */}
        <svg
          width={160}
          height={95}
          viewBox="0 0 1400 800"
          style={{
            position: 'sticky',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(17, 22, 34, 0.9)',
            border: '1px solid #334155',
            borderRadius: 6,
          }}
        >
          {scenes.map((s) => (
            <rect
              key={s.id}
              x={s.position.x}
              y={s.position.y}
              width={210}
              height={85}
              rx={12}
              fill={s.id === activeSceneId ? '#6366f1' : '#475569'}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  backgroundColor: '#0a0d14',
  border: '1px solid #242f44',
  borderRadius: 5,
  padding: '4px 8px',
  fontSize: 11.5,
  color: '#f1f5f9',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 5,
  backgroundColor: '#6366f1',
  color: '#fff',
  fontSize: 11.5,
  fontWeight: 600,
};

const nudgeBtnStyle: React.CSSProperties = {
  padding: '1px 6px',
  fontSize: 10,
  backgroundColor: '#1e293b',
  color: '#cbd5e1',
  borderRadius: 4,
};
