import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Grid3x3, Link2, Maximize2, Minus, Plus } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { MindMap, MindMapNode, MindMapNodeShape } from '../../types/project';

interface MindMapCanvasSvgProps {
  map: MindMap;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onMoveNode: (nodeId: string, dx: number, dy: number) => void;
  onCreateEdge: (fromNodeId: string, toNodeId: string) => void;
}

interface NodeGeom {
  lines: string[];
  linkedLabel: string | null;
  halfW: number;
  halfH: number;
  radius: number;
}

const LINKED_KIND_PT: Record<string, string> = {
  character: 'Personagem', faction: 'Facção', location: 'Local', object: 'Objeto', scene: 'Cena',
};

function estimateTextWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    if ("iIl1.,;:'!| ".includes(ch)) w += 4;
    else if ('MWQG@%#&'.includes(ch) || (ch >= 'A' && ch <= 'Z')) w += 8.2;
    else w += 6.7;
  }
  return w;
}

function wrapLines(label: string, maxChars = 20): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['Nó'];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) { lines.push(current); current = ''; }
      for (let i = 0; i < word.length; i += maxChars) lines.push(word.slice(i, i + maxChars));
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) current = next;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

function computeNodeGeometry(node: MindMapNode): NodeGeom {
  const lines = wrapLines(node.label, 20);
  const linkedLabel = node.type === 'linked' ? LINKED_KIND_PT[node.linkedEntityKind ?? 'character'] ?? 'Entidade' : null;
  const maxLabelW = Math.max(...lines.map(estimateTextWidth), linkedLabel ? estimateTextWidth(linkedLabel) * 0.88 : 0);
  const tw = Math.max(72, Math.ceil(maxLabelW)) / 2;
  const th = (lines.length * 16 + (linkedLabel ? 16 : 0)) / 2;
  if (node.shape === 'circle') {
    const r = Math.max(44, Math.ceil(Math.hypot(tw, th)) + 14);
    return { lines, linkedLabel, halfW: r, halfH: r, radius: r };
  }
  if (node.shape === 'diamond') return { lines, linkedLabel, halfW: Math.max(76, Math.ceil(tw * 2.1 + 18)), halfH: Math.max(48, Math.ceil(th * 2.1 + 14)), radius: 0 };
  if (node.shape === 'hexagon') return { lines, linkedLabel, halfW: Math.max(66, Math.ceil((tw + 14) / 0.55)), halfH: Math.max(40, Math.ceil(th + 14)), radius: 0 };
  if (node.shape === 'ellipse') return { lines, linkedLabel, halfW: Math.max(68, Math.ceil(tw + 22)), halfH: Math.max(26, Math.ceil(th + 12)), radius: 0 };
  return { lines, linkedLabel, halfW: Math.max(66, Math.ceil(tw + 16)), halfH: Math.max(27, Math.ceil(th + 12)), radius: 0 };
}

function boundaryOffset(shape: MindMapNodeShape, geom: NodeGeom, ux: number, uy: number, pad = 0) {
  const ax = Math.abs(ux), ay = Math.abs(uy);
  if (ax < 1e-5 && ay < 1e-5) return { ox: 0, oy: 0 };
  const hw = geom.halfW + pad, hh = geom.halfH + pad;
  let d = hw;
  if (shape === 'circle') d = geom.radius + pad;
  else if (shape === 'diamond') d = 1 / (ax / hw + ay / hh);
  else if (shape === 'ellipse') d = 1 / Math.hypot(ux / hw, uy / hh);
  else if (shape === 'hexagon') d = Math.min(ay > 1e-5 ? hh / ay : Infinity, 1 / (ax / hw + ay / (2.2 * hh)));
  else d = Math.min(ax > 1e-5 ? hw / ax : Infinity, ay > 1e-5 ? hh / ay : Infinity);
  return { ox: ux * d, oy: uy * d };
}

function computeBezierEdge(fp: { x: number; y: number }, tp: { x: number; y: number }, from: MindMapNode, to: MindMapNode, fg: NodeGeom, tg: NodeGeom) {
  const dx = tp.x - fp.x, dy = tp.y - fp.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const sOff = boundaryOffset(from.shape, fg, ux, uy, 2);
  const eOff = boundaryOffset(to.shape, tg, -ux, -uy, 5);
  const sx = fp.x + sOff.ox, sy = fp.y + sOff.oy, ex = tp.x + eOff.ox, ey = tp.y + eOff.oy;
  const horiz = Math.abs(dx) >= Math.abs(dy);
  const curve = Math.max(44, (horiz ? Math.abs(ex - sx) : Math.abs(ey - sy)) * 0.45);
  const c1x = horiz ? sx + Math.sign(ex - sx || 1) * curve : sx, c1y = horiz ? sy : sy + Math.sign(ey - sy || 1) * curve;
  const c2x = horiz ? ex - Math.sign(ex - sx || 1) * curve : ex, c2y = horiz ? ey : ey - Math.sign(ey - sy || 1) * curve;
  return {
    d: `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`,
    midX: 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * ex,
    midY: 0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ey,
  };
}

function renderShapePrimitive(node: MindMapNode, g: NodeGeom, fill: string, stroke: string, sw: number) {
  const { halfW: hw, halfH: hh, radius: r } = g;
  if (node.shape === 'circle') return <circle cx={0} cy={0} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />;
  if (node.shape === 'ellipse') return <rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={hh} fill={fill} stroke={stroke} strokeWidth={sw} />;
  if (node.shape === 'diamond') return <polygon points={`0,${-hh} ${hw},0 0,${hh} ${-hw},0`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
  if (node.shape === 'hexagon') {
    const ix = hw * 0.56;
    return <polygon points={`${-hw},0 ${-ix},${-hh} ${ix},${-hh} ${hw},0 ${ix},${hh} ${-ix},${hh}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
  }
  return <rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={10} fill={fill} stroke={stroke} strokeWidth={sw} />;
}

export function MindMapCanvasSvg({ map, selectedNodeId, onSelectNode, onMoveNode, onCreateEdge }: MindMapCanvasSvgProps) {
  const { settings } = useProject();
  const reducedMotion = settings.reducedMotion || !settings.enableAnimations || settings.lowPowerMode;
  const uid = useId().replace(/:/g, '_');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewport, setViewport] = useState({ width: 900, height: 580 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(settings.graphGridEnabled);
  const [spacePressed, setSpacePressed] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<'pan' | 'node' | null>(null);
  const [dragPreview, setDragPreview] = useState<{ nodeId: string; dx: number; dy: number } | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const viewportRef = useRef(viewport);
  const dragSessionRef = useRef<
    | { kind: 'pan'; startX: number; startY: number; origX: number; origY: number }
    | { kind: 'node'; nodeId: string; startX: number; startY: number; dx: number; dy: number; moved: boolean }
    | null
  >(null);
  zoomRef.current = zoom;
  panRef.current = pan;
  viewportRef.current = viewport;

  const geometries = useMemo(() => {
    const rec = new Map<string, NodeGeom>();
    for (const node of map.nodes) rec.set(node.id, computeNodeGeometry(node));
    return rec;
  }, [map.nodes]);

  const fitMapToView = useCallback(() => {
    const vp = viewportRef.current;
    if (map.nodes.length === 0) {
      setZoom(1);
      setPan({ x: vp.width / 2, y: vp.height / 2 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of map.nodes) {
      const g = geometries.get(n.id) ?? computeNodeGeometry(n);
      minX = Math.min(minX, n.x - g.halfW); maxX = Math.max(maxX, n.x + g.halfW);
      minY = Math.min(minY, n.y - g.halfH); maxY = Math.max(maxY, n.y + g.halfH);
    }
    const pad = 56;
    const nextZoom = Math.min(1.6, Math.max(0.35, +Math.min((vp.width - pad * 2) / Math.max(80, maxX - minX), (vp.height - pad * 2) / Math.max(80, maxY - minY)).toFixed(3)));
    setZoom(nextZoom);
    setPan({ x: vp.width / 2 - ((minX + maxX) / 2) * nextZoom, y: vp.height / 2 - ((minY + maxY) / 2) * nextZoom });
  }, [map.nodes, geometries]);

  const lastFittedRef = useRef<string | null>(null);
  useEffect(() => {
    if (viewport.width > 100 && lastFittedRef.current !== map.id) {
      lastFittedRef.current = map.id;
      fitMapToView();
    }
  }, [map.id, viewport.width, fitMapToView]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setViewport({ width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onShortcut = (ev: Event) => {
      if ((ev as CustomEvent<{ action?: string }>).detail?.action === 'fitGraphOrMap') fitMapToView();
    };
    window.addEventListener('inkgraph:shortcut', onShortcut);
    return () => window.removeEventListener('inkgraph:shortcut', onShortcut);
  }, [fitMapToView]);

  useEffect(() => {
    const isInput = (t: EventTarget | null) => t instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isInput(e.target)) { e.preventDefault(); setSpacePressed(true); }
      else if (e.key === 'Escape') { if (connectSourceId) setConnectSourceId(null); else if (connectMode) setConnectMode(false); }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [connectMode, connectSourceId]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top, z0 = zoomRef.current, p0 = panRef.current;
      const wx = (mx - p0.x) / z0, wy = (my - p0.y) / z0;
      const nextZoom = Math.min(2.5, Math.max(0.35, +(z0 * Math.min(1.25, Math.max(0.8, Math.exp(-e.deltaY * 0.0016)))).toFixed(3)));
      setZoom(nextZoom);
      setPan({ x: mx - wx * nextZoom, y: my - wy * nextZoom });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const s = dragSessionRef.current;
      if (!s) return;
      if (s.kind === 'pan') setPan({ x: s.origX + (e.clientX - s.startX), y: s.origY + (e.clientY - s.startY) });
      else {
        s.dx = (e.clientX - s.startX) / zoomRef.current;
        s.dy = (e.clientY - s.startY) / zoomRef.current;
        if (Math.hypot(e.clientX - s.startX, e.clientY - s.startY) > 3) s.moved = true;
        if (s.moved) setDragPreview({ nodeId: s.nodeId, dx: s.dx, dy: s.dy });
      }
    };
    const onUp = () => {
      const s = dragSessionRef.current;
      if (s?.kind === 'node' && s.moved) onMoveNode(s.nodeId, Math.round(s.dx), Math.round(s.dy));
      dragSessionRef.current = null;
      setIsDragging(null);
      setDragPreview(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [isDragging, onMoveNode]);

  const zoomAtCenter = (delta: number) => {
    const cx = viewport.width / 2, cy = viewport.height / 2;
    const wx = (cx - pan.x) / zoom, wy = (cy - pan.y) / zoom;
    const nextZoom = Math.min(2.5, Math.max(0.35, +(zoom + delta).toFixed(2)));
    setZoom(nextZoom);
    setPan({ x: cx - wx * nextZoom, y: cy - wy * nextZoom });
  };

  const getPos = (n: MindMapNode) => (dragPreview?.nodeId === n.id ? { x: n.x + dragPreview.dx, y: n.y + dragPreview.dy } : { x: n.x, y: n.y });
  const gridId = `mmGrid_${uid}`, shadowId = `mmShadow_${uid}`, arrowEndId = `mmArrowEnd_${uid}`, arrowStartId = `mmArrowStart_${uid}`, arrowAccentId = `mmArrowAccent_${uid}`;
  const connectSourceNode = connectSourceId ? map.nodes.find((n) => n.id === connectSourceId) : null;

  return (
    <div style={canvasContainerStyle}>
      <div style={hudBarStyle}>
        <button
          type="button"
          onClick={() => { setConnectMode((v) => !v); setConnectSourceId(null); }}
          style={{ ...hudBtnStyle, backgroundColor: connectMode ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: connectMode ? '#ffffff' : 'var(--text-primary)' }}
          title="Ativar ferramenta de ligação direta entre nós"
        >
          <Link2 size={13} /> Conectar Nós
        </button>
        <button
          type="button"
          onClick={() => setShowGrid((g) => !g)}
          style={{ ...hudBtnStyle, backgroundColor: showGrid ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: showGrid ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          title="Alternar grade"
        >
          <Grid3x3 size={13} />
        </button>
        <button type="button" onClick={() => zoomAtCenter(-0.18)} style={hudBtnStyle} title="Reduzir zoom"><Minus size={13} /></button>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => zoomAtCenter(0.18)} style={hudBtnStyle} title="Ampliar zoom"><Plus size={13} /></button>
        <button type="button" onClick={fitMapToView} style={hudBtnStyle} title="Enquadrar Mapa (Alt+0)"><Maximize2 size={13} /> Enquadrar Mapa</button>
      </div>

      {connectMode && (
        <div style={connectBannerStyle}>
          {connectSourceId ? 'Clique no nó de destino para criar a conexão (Esc cancela)' : 'Modo conexão: clique no nó de origem'}
        </div>
      )}

      <svg
        ref={svgRef}
        onPointerDown={(e) => {
          if (e.button === 1) e.preventDefault();
          const el = e.target as Element | null;
          const isBg = el === svgRef.current || el?.getAttribute('data-canvas-bg') === 'true';
          if (e.button === 1 || spacePressed || (e.button === 0 && isBg)) {
            if (connectMode && isBg && !spacePressed && e.button === 0) setConnectSourceId(null);
            dragSessionRef.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
            setIsDragging('pan');
          }
        }}
        onPointerMove={(e) => {
          if (!connectMode || !connectSourceId || !svgRef.current) return;
          const r = svgRef.current.getBoundingClientRect();
          setCursorWorld({ x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom });
        }}
        style={{ width: '100%', height: '100%', cursor: isDragging === 'pan' ? 'grabbing' : spacePressed ? 'grab' : connectMode ? 'crosshair' : 'grab', userSelect: 'none', touchAction: 'none' }}
      >
        <defs>
          <pattern id={gridId} width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-subtle)" strokeWidth={1 / zoom} opacity={0.45} />
          </pattern>
          <filter id={shadowId} x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.22" /></filter>
          <marker id={arrowEndId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--text-muted)" /></marker>
          <marker id={arrowStartId} markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto"><path d="M7,0 L0,3.5 L7,7 Z" fill="var(--text-muted)" /></marker>
          <marker id={arrowAccentId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--accent-primary)" /></marker>
        </defs>
        <rect data-canvas-bg="true" width="100%" height="100%" fill={showGrid ? `url(#${gridId})` : 'transparent'} />
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {map.edges.map((edge) => {
            const from = map.nodes.find((n) => n.id === edge.fromNodeId);
            const to = map.nodes.find((n) => n.id === edge.toNodeId);
            if (!from || !to) return null;
            const { d, midX, midY } = computeBezierEdge(getPos(from), getPos(to), from, to, geometries.get(from.id) ?? computeNodeGeometry(from), geometries.get(to.id) ?? computeNodeGeometry(to));
            const pillW = edge.label ? Math.max(40, Math.ceil(estimateTextWidth(edge.label) + 18)) : 0;
            return (
              <g key={edge.id}>
                <path d={d} fill="none" stroke="var(--text-muted)" strokeWidth={1.8} strokeDasharray={edge.style === 'dotted' ? '5 5' : undefined} markerEnd={`url(#${arrowEndId})`} markerStart={edge.direction === 'bi' ? `url(#${arrowStartId})` : undefined} />
                {edge.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x={-pillW / 2} y={-10} width={pillW} height={20} rx={10} fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth={1} />
                    <text y={0.5} dominantBaseline="central" fill="var(--text-secondary)" fontSize={10} fontWeight={600} textAnchor="middle">{edge.label}</text>
                  </g>
                )}
              </g>
            );
          })}
          {connectMode && connectSourceNode && cursorWorld && (
            <line x1={getPos(connectSourceNode).x} y1={getPos(connectSourceNode).y} x2={cursorWorld.x} y2={cursorWorld.y} stroke="var(--accent-primary)" strokeWidth={2} strokeDasharray="6 4" markerEnd={`url(#${arrowAccentId})`} style={{ pointerEvents: 'none' }} />
          )}
          {map.nodes.map((node) => {
            const isSelected = node.id === selectedNodeId, isHovered = node.id === hoveredNodeId, isSource = node.id === connectSourceId;
            const pos = getPos(node), geom = geometries.get(node.id) ?? computeNodeGeometry(node);
            const startY = -(geom.lines.length * 16 + (geom.linkedLabel ? 16 : 0)) / 2 + 8;
            const stroke = isSource ? 'var(--accent-primary)' : isSelected ? 'var(--text-primary)' : node.color;
            const sw = isSelected || isSource ? 2.4 : 1.6;
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y}) scale(${!reducedMotion && isHovered ? 1.035 : 1})`}
                filter={isSelected || isHovered || isSource ? `url(#${shadowId})` : undefined}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId((p) => (p === node.id ? null : p))}
                onPointerDown={(e) => {
                  if (spacePressed || e.button !== 0) return;
                  e.stopPropagation();
                  if (connectMode) {
                    if (!connectSourceId) { setConnectSourceId(node.id); setCursorWorld(pos); }
                    else if (connectSourceId !== node.id) { onCreateEdge(connectSourceId, node.id); setConnectSourceId(null); setCursorWorld(null); }
                    else setConnectSourceId(null);
                    return;
                  }
                  onSelectNode(node.id);
                  dragSessionRef.current = { kind: 'node', nodeId: node.id, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false };
                  setIsDragging('node');
                }}
                style={{ cursor: connectMode ? 'pointer' : 'move', transition: reducedMotion ? 'none' : 'transform 130ms ease' }}
              >
                {renderShapePrimitive(node, geom, 'var(--bg-surface)', 'none', 0)}
                {renderShapePrimitive(node, geom, `${node.color}26`, stroke, sw)}
                <text fill="var(--text-primary)" fontSize={12} fontWeight={700} textAnchor="middle" style={{ pointerEvents: 'none' }}>
                  {geom.lines.map((line, i) => <tspan key={i} x={0} y={startY + i * 16} dominantBaseline="central">{line}</tspan>)}
                </text>
                {geom.linkedLabel && (
                  <text x={0} y={startY + geom.lines.length * 16 + 1} dominantBaseline="central" fill="var(--text-secondary)" fontSize={9.5} fontWeight={600} textAnchor="middle" style={{ pointerEvents: 'none' }}>[{geom.linkedLabel}]</text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {selectedNodeId && (
        <div style={nudgeBarStyle}>
          {([[-25, 0, '←'], [0, -25, '↑'], [0, 25, '↓'], [25, 0, '→']] as const).map(([dx, dy, glyph]) => (
            <button key={glyph} type="button" onClick={() => onMoveNode(selectedNodeId, dx, dy)} style={hudBtnStyle}>{glyph}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const canvasContainerStyle: React.CSSProperties = { flex: 1, minWidth: 0, position: 'relative', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const hudBarStyle: React.CSSProperties = { position: 'absolute', top: 10, right: 10, zIndex: 5, display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'var(--bg-surface)', padding: 5, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' };
const connectBannerStyle: React.CSSProperties = { position: 'absolute', top: 10, left: 10, zIndex: 5, padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600 };
const nudgeBarStyle: React.CSSProperties = { position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 4, backgroundColor: 'var(--bg-surface)', padding: 5, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' };
const hudBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600 };
