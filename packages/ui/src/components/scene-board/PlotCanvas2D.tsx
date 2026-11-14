import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Grid, Grid3x3, Link2, Maximize2, Minus, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { PlotConnectionType, Scene } from '../../types/project';

interface PlotCanvas2DProps {
  selectedSubplotId: string | null;
}

const CARD_W = 220;
const CARD_H = 104;

const CONN_COLORS: Record<PlotConnectionType, string> = {
  'cause-effect': '#ef4444', 'character-arc': '#3b82f6', parallel: '#a855f7', subplot: '#10b981', temporal: '#f59e0b',
};

const CONN_LABELS: Record<PlotConnectionType, string> = {
  'cause-effect': 'Causa e Efeito', 'character-arc': 'Arco de Personagem', parallel: 'Paralelo', subplot: 'Subtrama', temporal: 'Temporal',
};

function cardRectEdgePoint(cx: number, cy: number, ux: number, uy: number, pad = 0) {
  const hw = CARD_W / 2 + pad, hh = CARD_H / 2 + pad;
  const ax = Math.abs(ux), ay = Math.abs(uy);
  if (ax < 1e-5 && ay < 1e-5) return { x: cx, y: cy };
  const t = Math.min(ax > 1e-5 ? hw / ax : Infinity, ay > 1e-5 ? hh / ay : Infinity);
  return { x: cx + ux * t, y: cy + uy * t };
}

function buildEdgeCurve(fromPos: { x: number; y: number }, toPos: { x: number; y: number }) {
  const fx = fromPos.x + CARD_W / 2, fy = fromPos.y + CARD_H / 2;
  const tx = toPos.x + CARD_W / 2, ty = toPos.y + CARD_H / 2;
  const dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const s = cardRectEdgePoint(fx, fy, ux, uy, 2);
  const e = cardRectEdgePoint(tx, ty, -ux, -uy, 6);
  const horiz = Math.abs(dx) >= Math.abs(dy);
  const curve = Math.max(48, (horiz ? Math.abs(e.x - s.x) : Math.abs(e.y - s.y)) * 0.45);
  const c1x = horiz ? s.x + Math.sign(e.x - s.x || 1) * curve : s.x, c1y = horiz ? s.y : s.y + Math.sign(e.y - s.y || 1) * curve;
  const c2x = horiz ? e.x - Math.sign(e.x - s.x || 1) * curve : e.x, c2y = horiz ? e.y : e.y - Math.sign(e.y - s.y || 1) * curve;
  return {
    d: `M ${s.x} ${s.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${e.x} ${e.y}`,
    midX: 0.125 * s.x + 0.375 * c1x + 0.375 * c2x + 0.125 * e.x,
    midY: 0.125 * s.y + 0.375 * c1y + 0.375 * c2y + 0.125 * e.y,
  };
}

export function PlotCanvas2D({ selectedSubplotId }: PlotCanvas2DProps) {
  const { project, settings, activeSceneId, setActiveSceneId, upsertScene, upsertPlotConnection, deletePlotConnection } = useProject();
  const reducedMotion = settings.reducedMotion || !settings.enableAnimations || settings.lowPowerMode;
  const uid = useId().replace(/:/g, '_');

  const scenes = useMemo(() => project.scenes.filter((s) => !selectedSubplotId || s.subplotIds.includes(selectedSubplotId)), [project.scenes, selectedSubplotId]);
  const [fromId, setFromId] = useState(scenes[0]?.id ?? '');
  const [toId, setToId] = useState(scenes[1]?.id ?? '');
  const [connType, setConnType] = useState<PlotConnectionType>('cause-effect');
  const [connLabel, setConnLabel] = useState('');
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 900, height: 500 });
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(settings.graphGridEnabled);
  const [spacePressed, setSpacePressed] = useState(false);
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<'pan' | 'card' | null>(null);
  const [cardPreview, setCardPreview] = useState<{ sceneId: string; x: number; y: number } | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const vpRef = useRef(viewport);
  const dragRef = useRef<
    | { kind: 'pan'; startX: number; startY: number; origPanX: number; origPanY: number }
    | { kind: 'card'; scene: Scene; startX: number; startY: number; curX: number; curY: number; moved: boolean }
    | null
  >(null);
  zoomRef.current = zoom;
  panRef.current = pan;
  vpRef.current = viewport;

  const fitAllScenes = useCallback(() => {
    const vp = vpRef.current;
    const list = scenes.length > 0 ? scenes : project.scenes;
    if (list.length === 0) { setZoom(1); setPan({ x: 40, y: 40 }); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of list) {
      minX = Math.min(minX, s.position.x); maxX = Math.max(maxX, s.position.x + CARD_W);
      minY = Math.min(minY, s.position.y); maxY = Math.max(maxY, s.position.y + CARD_H);
    }
    const pad = 56;
    const nextZoom = Math.min(1.4, Math.max(0.4, +Math.min((vp.width - pad * 2) / Math.max(120, maxX - minX), (vp.height - pad * 2) / Math.max(100, maxY - minY)).toFixed(3)));
    setZoom(nextZoom);
    setPan({ x: vp.width / 2 - ((minX + maxX) / 2) * nextZoom, y: vp.height / 2 - ((minY + maxY) / 2) * nextZoom });
  }, [scenes, project.scenes]);

  const didAutoFitRef = useRef(false);
  useEffect(() => {
    if (viewport.width > 120 && !didAutoFitRef.current) { didAutoFitRef.current = true; fitAllScenes(); }
  }, [viewport.width, fitAllScenes]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) setViewport({ width: r.width, height: r.height }); };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onShortcut = (ev: Event) => {
      if ((ev as CustomEvent<{ action?: string }>).detail?.action === 'fitGraphOrMap') fitAllScenes();
    };
    window.addEventListener('inkgraph:shortcut', onShortcut);
    return () => window.removeEventListener('inkgraph:shortcut', onShortcut);
  }, [fitAllScenes]);

  useEffect(() => {
    const isInput = (t: EventTarget | null) => t instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isInput(e.target)) { e.preventDefault(); setSpacePressed(true); }
      else if (e.key === 'Escape') {
        if (connectSourceId) setConnectSourceId(null);
        else if (connectMode) setConnectMode(false);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [connectMode, connectSourceId]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top, z0 = zoomRef.current, p0 = panRef.current;
      const wx = (mx - p0.x) / z0, wy = (my - p0.y) / z0;
      const nextZoom = Math.min(2.2, Math.max(0.4, +(z0 * Math.min(1.25, Math.max(0.8, Math.exp(-e.deltaY * 0.0016)))).toFixed(3)));
      setZoom(nextZoom);
      setPan({ x: mx - wx * nextZoom, y: my - wy * nextZoom });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const s = dragRef.current;
      if (!s) return;
      if (s.kind === 'pan') setPan({ x: s.origPanX + (e.clientX - s.startX), y: s.origPanY + (e.clientY - s.startY) });
      else {
        const dist = Math.hypot(e.clientX - s.startX, e.clientY - s.startY);
        s.curX = s.scene.position.x + (e.clientX - s.startX) / zoomRef.current;
        s.curY = s.scene.position.y + (e.clientY - s.startY) / zoomRef.current;
        if (dist > 3) s.moved = true;
        if (s.moved) setCardPreview({ sceneId: s.scene.id, x: s.curX, y: s.curY });
      }
    };
    const onUp = () => {
      const s = dragRef.current;
      if (s?.kind === 'card' && s.moved) upsertScene({ ...s.scene, position: { x: Math.round(s.curX), y: Math.round(s.curY) } });
      dragRef.current = null;
      setIsDragging(null);
      setCardPreview(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [isDragging, upsertScene]);

  const createPlotConnection = (src: string, dst: string) => {
    if (!src || !dst || src === dst) return;
    upsertPlotConnection({ id: `pconn_${Date.now()}`, fromSceneId: src, toSceneId: dst, type: connType, label: connLabel.trim() || CONN_LABELS[connType] });
    setConnLabel('');
  };

  const nudgeScene = (scene: Scene, dx: number, dy: number) => upsertScene({ ...scene, position: { x: scene.position.x + dx, y: scene.position.y + dy } });
  const snapToGrid = () => scenes.forEach((s, idx) => upsertScene({ ...s, position: { x: 60 + (idx % 4) * 260, y: 60 + Math.floor(idx / 4) * 160 } }));
  const zoomAtCenter = (delta: number) => {
    const cx = viewport.width / 2, cy = viewport.height / 2, wx = (cx - pan.x) / zoom, wy = (cy - pan.y) / zoom;
    const nextZoom = Math.min(2.2, Math.max(0.4, +(zoom + delta).toFixed(2)));
    setZoom(nextZoom);
    setPan({ x: cx - wx * nextZoom, y: cy - wy * nextZoom });
  };

  const getScenePos = (s: Scene) => (cardPreview?.sceneId === s.id ? { x: cardPreview.x, y: cardPreview.y } : s.position);
  const minimapBounds = useMemo(() => {
    if (scenes.length === 0) return '0 0 1200 700';
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of scenes) { minX = Math.min(minX, s.position.x); maxX = Math.max(maxX, s.position.x + CARD_W); minY = Math.min(minY, s.position.y); maxY = Math.max(maxY, s.position.y + CARD_H); }
    return `${minX - 60} ${minY - 60} ${Math.max(300, maxX - minX + 120)} ${Math.max(200, maxY - minY + 120)}`;
  }, [scenes]);

  const gridId = `plotGrid_${uid}`, arrowId = `arrowPlot_${uid}`, accentArrowId = `arrowPlotAccent_${uid}`;
  const connectSourceScene = connectSourceId ? scenes.find((s) => s.id === connectSourceId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', minWidth: 0, overflow: 'hidden' }}>
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link2 size={14} color="var(--accent-primary)" />
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} style={selectStyle}>
            <option value="">Origem...</option>
            {project.scenes.map((s) => <option key={s.id} value={s.id}>#{s.chapterNumber} {s.title}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
          <select value={toId} onChange={(e) => setToId(e.target.value)} style={selectStyle}>
            <option value="">Destino...</option>
            {project.scenes.map((s) => <option key={s.id} value={s.id}>#{s.chapterNumber} {s.title}</option>)}
          </select>
          <select value={connType} onChange={(e) => setConnType(e.target.value as PlotConnectionType)} style={selectStyle}>
            {Object.entries(CONN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input placeholder="Rótulo opcional..." value={connLabel} onChange={(e) => setConnLabel(e.target.value)} style={{ ...selectStyle, width: 130 }} />
          <button type="button" onClick={() => createPlotConnection(fromId, toId)} style={primaryBtnStyle}>Conectar</button>
          <button type="button" onClick={() => { setConnectMode((v) => !v); setConnectSourceId(null); }} style={{ ...hudBtnStyle, backgroundColor: connectMode ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: connectMode ? '#ffffff' : 'var(--text-primary)' }}>
            <Link2 size={13} /> Conectar Cenas
          </button>
        </div>
        <button type="button" onClick={snapToGrid} style={hudBtnStyle}><Grid size={13} /> Ajustar à grade</button>
      </div>

      <div
        ref={viewportRef}
        onPointerDown={(e) => {
          if (e.button === 1) e.preventDefault();
          const el = e.target as Element | null;
          const isBg = el === viewportRef.current || el?.getAttribute('data-canvas-bg') === 'true';
          if (e.button === 1 || spacePressed || (e.button === 0 && isBg)) {
            if (connectMode && isBg && !spacePressed && e.button === 0) setConnectSourceId(null);
            dragRef.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y };
            setIsDragging('pan');
          }
        }}
        onPointerMove={(e) => {
          if (!connectMode || !connectSourceId || !viewportRef.current) return;
          const r = viewportRef.current.getBoundingClientRect();
          setCursorWorld({ x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom });
        }}
        style={{ ...canvasViewportStyle, cursor: isDragging === 'pan' ? 'grabbing' : spacePressed ? 'grab' : connectMode ? 'crosshair' : 'grab' }}
      >
        <div style={hudBarStyle} onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setShowGrid((g) => !g)} style={{ ...hudBtnStyle, backgroundColor: showGrid ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: showGrid ? 'var(--accent-primary)' : 'var(--text-secondary)' }} title="Alternar grade"><Grid3x3 size={13} /></button>
          <button type="button" onClick={() => zoomAtCenter(-0.18)} style={hudBtnStyle} title="Reduzir zoom"><Minus size={13} /></button>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => zoomAtCenter(0.18)} style={hudBtnStyle} title="Ampliar zoom"><Plus size={13} /></button>
          <button type="button" onClick={fitAllScenes} style={hudBtnStyle} title="Enquadrar Todas as Cenas (Alt+0)"><Maximize2 size={13} /> Enquadrar Todas as Cenas</button>
        </div>

        {connectMode && (
          <div style={connectBannerStyle}>
            {connectSourceId ? 'Clique na cena de destino para conectar (Esc cancela)' : 'Modo conexão: clique na cena de origem'}
          </div>
        )}

        <svg data-canvas-bg="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <pattern id={gridId} width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-subtle)" strokeWidth={1 / zoom} opacity={0.45} />
            </pattern>
            <marker id={arrowId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--text-muted)" /></marker>
            <marker id={accentArrowId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--accent-primary)" /></marker>
          </defs>
          <rect data-canvas-bg="true" width="100%" height="100%" fill={showGrid ? `url(#${gridId})` : 'transparent'} />
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ pointerEvents: 'none' }}>
            {project.plotConnections.map((conn) => {
              const from = scenes.find((s) => s.id === conn.fromSceneId);
              const to = scenes.find((s) => s.id === conn.toSceneId);
              if (!from || !to) return null;
              const { d, midX, midY } = buildEdgeCurve(getScenePos(from), getScenePos(to));
              const color = CONN_COLORS[conn.type], label = conn.label || CONN_LABELS[conn.type], pillW = Math.max(54, label.length * 6.4 + 16);
              return (
                <g key={conn.id}>
                  <path d={d} fill="none" stroke={color} strokeWidth={2} markerEnd={`url(#${arrowId})`} />
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x={-pillW / 2} y={-10} width={pillW} height={20} rx={10} fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth={1} />
                    <text y={0.5} dominantBaseline="central" fill={color} fontSize={10} fontWeight={600} textAnchor="middle">{label}</text>
                  </g>
                </g>
              );
            })}
            {connectMode && connectSourceScene && cursorWorld && (
              <line x1={getScenePos(connectSourceScene).x + CARD_W / 2} y1={getScenePos(connectSourceScene).y + CARD_H / 2} x2={cursorWorld.x} y2={cursorWorld.y} stroke="var(--accent-primary)" strokeWidth={2} strokeDasharray="6 4" markerEnd={`url(#${accentArrowId})`} />
            )}
          </g>
        </svg>

        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
          {scenes.map((scene) => {
            const pos = getScenePos(scene), isSelected = scene.id === activeSceneId, isSource = scene.id === connectSourceId, isHovered = scene.id === hoveredSceneId;
            return (
              <div
                key={scene.id}
                onMouseEnter={() => setHoveredSceneId(scene.id)}
                onMouseLeave={() => setHoveredSceneId((p) => (p === scene.id ? null : p))}
                onPointerDown={(e) => {
                  if (spacePressed || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
                  e.stopPropagation();
                  if (connectMode) {
                    if (!connectSourceId) { setConnectSourceId(scene.id); setCursorWorld({ x: pos.x + CARD_W / 2, y: pos.y + CARD_H / 2 }); }
                    else if (connectSourceId !== scene.id) { createPlotConnection(connectSourceId, scene.id); setConnectSourceId(null); setCursorWorld(null); }
                    else setConnectSourceId(null);
                    return;
                  }
                  setActiveSceneId(scene.id);
                  dragRef.current = { kind: 'card', scene, startX: e.clientX, startY: e.clientY, curX: scene.position.x, curY: scene.position.y, moved: false };
                  setIsDragging('card');
                }}
                style={{
                  position: 'absolute', left: pos.x, top: pos.y, width: CARD_W, padding: 10, borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--bg-elevated)' : isHovered ? 'var(--bg-hover)' : 'var(--bg-surface)',
                  border: `1.5px solid ${isSource || isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  boxShadow: isSelected || isHovered ? '0 8px 20px -6px rgba(0, 0, 0, 0.25)' : 'var(--card-shadow)',
                  cursor: connectMode ? 'pointer' : 'grab', pointerEvents: 'auto', userSelect: 'none',
                  transition: reducedMotion ? 'none' : 'background-color 120ms ease, box-shadow 120ms ease',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{scene.chapterNumber} {scene.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Ato {scene.act} • Tensão {scene.tension}%</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {([[-30, 0, '←'], [0, -30, '↑'], [0, 30, '↓'], [30, 0, '→']] as const).map(([dx, dy, glyph]) => (
                      <button key={glyph} type="button" onClick={() => nudgeScene(scene, dx, dy)} style={nudgeBtnStyle}>{glyph}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {project.plotConnections.filter((c) => c.fromSceneId === scene.id).map((c) => (
                      <button key={c.id} type="button" onClick={(e) => { e.stopPropagation(); deletePlotConnection(c.id); }} title="Remover conexão de saída" style={{ background: 'transparent', color: 'var(--danger)', padding: 2 }}><Trash2 size={11} /></button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <svg width={156} height={92} viewBox={minimapBounds} style={minimapStyle} onPointerDown={(e) => e.stopPropagation()}>
          {scenes.map((s) => {
            const p = getScenePos(s);
            return <rect key={s.id} x={p.x} y={p.y} width={CARD_W} height={CARD_H} rx={12} fill={s.id === activeSceneId ? 'var(--accent-primary)' : 'var(--text-muted)'} opacity={s.id === activeSceneId ? 1 : 0.65} />;
          })}
        </svg>
      </div>
    </div>
  );
}

const toolbarStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--card-shadow)' };
const canvasViewportStyle: React.CSSProperties = { position: 'relative', flex: 1, minHeight: 0, backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', touchAction: 'none', userSelect: 'none' };
const hudBarStyle: React.CSSProperties = { position: 'absolute', top: 10, right: 10, zIndex: 5, display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'var(--bg-surface)', padding: 5, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' };
const connectBannerStyle: React.CSSProperties = { position: 'absolute', top: 10, left: 10, zIndex: 5, padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600 };
const minimapStyle: React.CSSProperties = { position: 'absolute', bottom: 10, left: 10, zIndex: 4, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', opacity: 0.92 };
const selectStyle: React.CSSProperties = { backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 11.5, color: 'var(--text-primary)' };
const primaryBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-primary)', color: '#ffffff', fontSize: 11.5, fontWeight: 600 };
const hudBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600 };
const nudgeBtnStyle: React.CSSProperties = { padding: '1px 6px', fontSize: 10, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 4 };
