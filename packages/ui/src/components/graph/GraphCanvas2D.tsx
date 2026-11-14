import { useRef, useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { buildThemeCssVars } from '../../domain/themes';
import type { RelationshipType } from '../../types/project';
import { REL_COLORS, computeOneHopNeighborhood, type GraphNode, type GraphLink } from './graphDataBuilder';

interface GraphCanvas2DProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onOpenDossier?: (node: GraphNode) => void;
  repulsionStrength: number;
  onPinnedCountChange: (count: number) => void;
  releaseSignal: number;
}

interface CollisionNode { kind?: GraphNode['kind']; x?: number; y?: number; vx?: number; vy?: number; [key: string]: unknown }

const LIGHT_EDGE_OVERRIDES: Partial<Record<RelationshipType, string>> = {
  trade: '#b45309', ally: '#059669', mentor: '#2563eb',
  infiltrator: '#0d9488', exiled_member: '#4b5563', vassal: '#7c3aed', sovereign: '#9333ea',
};

const LEGEND_ITEMS: readonly { label: string; color: string; shape: 'circle' | 'hexagon' | 'square' }[] = [
  { label: 'Personagem', color: '#3b82f6', shape: 'circle' },
  { label: 'Facção', color: '#ef4444', shape: 'hexagon' },
  { label: 'Local', color: '#10b981', shape: 'square' },
  { label: 'Sistema', color: '#a855f7', shape: 'circle' },
  { label: 'Objeto', color: '#f59e0b', shape: 'circle' },
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getThemeEdgeColor(type: RelationshipType, isLightLike: boolean, alpha: number): string {
  const base = (isLightLike ? LIGHT_EDGE_OVERRIDES[type] : undefined) ?? REL_COLORS[type] ?? (isLightLike ? '#475569' : '#64748b');
  return alpha >= 0.99 ? base : hexToRgba(base, alpha);
}

function drawOutlinedText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  strokeColor: string, fillColor: string, strokePx: number, globalScale: number
) {
  ctx.lineJoin = 'round';
  ctx.lineWidth = strokePx / Math.max(0.5, globalScale);
  ctx.strokeStyle = strokeColor;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

function createCollisionForce(padding: number) {
  let simNodes: CollisionNode[] = [];
  const force = (alpha: number) => {
    const strength = 0.78 * Math.max(0.2, alpha);
    for (let i = 0; i < simNodes.length; i += 1) {
      const a = simNodes[i];
      const ax = (a.x ?? 0) + (a.vx ?? 0);
      const ay = (a.y ?? 0) + (a.vy ?? 0);
      const ra = (a.kind === 'faction' ? 11 : 9) + padding;
      for (let j = i + 1; j < simNodes.length; j += 1) {
        const b = simNodes[j];
        const minDist = ra + (b.kind === 'faction' ? 11 : 9) + padding;
        let dx = ax - ((b.x ?? 0) + (b.vx ?? 0));
        let dy = ay - ((b.y ?? 0) + (b.vy ?? 0));
        let distSq = dx * dx + dy * dy;
        if (distSq < minDist * minDist) {
          if (distSq === 0) { dx = 0.01; dy = 0.01; distSq = 0.0002; }
          const dist = Math.sqrt(distSq);
          const push = ((minDist - dist) / dist) * strength * 0.5;
          a.vx = (a.vx ?? 0) + dx * push;
          a.vy = (a.vy ?? 0) + dy * push;
          b.vx = (b.vx ?? 0) - dx * push;
          b.vy = (b.vy ?? 0) - dy * push;
        }
      }
    }
  };
  force.initialize = (nextNodes: CollisionNode[]) => { simNodes = nextNodes; };
  return force;
}

export function GraphCanvas2D({
  nodes, links, selectedNodeId, onSelectNode, onOpenDossier,
  repulsionStrength, onPinnedCountChange, releaseSignal,
}: GraphCanvas2DProps) {
  const { settings } = useProject();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const pinnedCoordsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const lastClickRef = useRef<{ nodeId: string; at: number } | null>(null);
  const lastReleaseSignalRef = useRef<number>(releaseSignal);
  const hasInitialFitRef = useRef<boolean>(false);

  const [dimensions, setDimensions] = useState({ width: 760, height: 600 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const resolvedTheme = useMemo(() => buildThemeCssVars(settings), [settings]);
  const isLightLike = resolvedTheme.mode !== 'dark';
  const colors = useMemo(() => ({
    bgCanvas: resolvedTheme.vars['--bg-canvas'],
    textPrimary: resolvedTheme.vars['--text-primary'],
    textSecondary: resolvedTheme.vars['--text-secondary'],
    borderSubtle: resolvedTheme.vars['--border-subtle'],
    accentPrimary: resolvedTheme.vars['--accent-primary'],
  }), [resolvedTheme]);

  // Measure container with ResizeObserver so tiling WM resizes (e.g. Niri) never clip or stretch canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.max(220, Math.floor(rect.width));
      const height = Math.max(220, Math.floor(rect.height));
      setDimensions((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    let visiblePinned = 0;
    for (const node of nodes) {
      const pinned = pinnedCoordsRef.current.get(node.id);
      if (pinned) { node.fx = pinned.x; node.fy = pinned.y; visiblePinned += 1; }
    }
    onPinnedCountChange(visiblePinned);
  }, [nodes, onPinnedCountChange]);

  useEffect(() => {
    if (hoveredNodeId && !nodes.some((n) => n.id === hoveredNodeId)) setHoveredNodeId(null);
  }, [nodes, hoveredNodeId]);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const charge = fg.d3Force('charge');
    if (charge && typeof charge.strength === 'function') {
      charge.strength(-repulsionStrength);
      charge.distanceMax?.(520);
    }
    const linkForce = fg.d3Force('link');
    if (linkForce && typeof linkForce.distance === 'function') linkForce.distance(165);
    fg.d3Force('collide', createCollisionForce(22));
    fg.d3ReheatSimulation();
    if (!hasInitialFitRef.current && nodes.length > 0) {
      hasInitialFitRef.current = true;
      const timer = window.setTimeout(() => fgRef.current?.zoomToFit(360, 52), 280);
      return () => window.clearTimeout(timer);
    }
  }, [repulsionStrength, graphData, nodes.length]);

  useEffect(() => {
    if (releaseSignal === lastReleaseSignalRef.current) return;
    lastReleaseSignalRef.current = releaseSignal;
    pinnedCoordsRef.current.clear();
    for (const n of nodes) { n.fx = undefined; n.fy = undefined; }
    onPinnedCountChange(0);
    fgRef.current?.d3ReheatSimulation();
  }, [releaseSignal, nodes, onPinnedCountChange]);

  useEffect(() => {
    const onShortcut = (ev: Event) => {
      if ((ev as CustomEvent<{ action?: string }>).detail?.action === 'fitGraphOrMap') fgRef.current?.zoomToFit(400, 48);
    };
    window.addEventListener('inkgraph:shortcut', onShortcut);
    return () => window.removeEventListener('inkgraph:shortcut', onShortcut);
  }, []);

  const focusNodeId = draggedNodeId ?? hoveredNodeId ?? (selectedNodeId || null);
  const activeBannerNode = useMemo(() => {
    const targetId = draggedNodeId ?? (selectedNodeId || null);
    return targetId ? nodes.find((n) => n.id === targetId) ?? null : null;
  }, [nodes, draggedNodeId, selectedNodeId]);
  const neighborhood = useMemo(() => computeOneHopNeighborhood(links, focusNodeId), [links, focusNodeId]);
  const dimAlpha = Math.max(0.05, Math.min(0.85, settings.graphDimIntensity ?? 0.14));

  const renderGridPre = useCallback(
    (ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!settings.graphGridEnabled) return;
      const fg = fgRef.current;
      const tl = fg?.screen2GraphCoords(0, 0) ?? { x: -1200, y: -1200 };
      const br = fg?.screen2GraphCoords(dimensions.width, dimensions.height) ?? { x: 1200, y: 1200 };
      const step = 64;
      const startX = Math.floor(Math.min(tl.x, br.x) / step) * step;
      const endX = Math.ceil(Math.max(tl.x, br.x) / step) * step;
      const startY = Math.floor(Math.min(tl.y, br.y) / step) * step;
      const endY = Math.ceil(Math.max(tl.y, br.y) / step) * step;
      ctx.save();
      ctx.strokeStyle = colors.borderSubtle;
      ctx.globalAlpha = isLightLike ? 0.5 : 0.32;
      ctx.lineWidth = 1 / Math.max(0.2, globalScale);
      ctx.beginPath();
      for (let gx = startX; gx <= endX; gx += step) { ctx.moveTo(gx, startY); ctx.lineTo(gx, endY); }
      for (let gy = startY; gy <= endY; gy += step) { ctx.moveTo(startX, gy); ctx.lineTo(endX, gy); }
      ctx.stroke();
      ctx.restore();
    },
    [settings.graphGridEnabled, dimensions.width, dimensions.height, colors.borderSubtle, isLightLike]
  );

  const paintNode = useCallback(
    (nodeObj: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = nodeObj as GraphNode;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const isSelected = n.id === selectedNodeId;
      const hasFocus = focusNodeId !== null;
      const isCenter = focusNodeId === n.id;
      const isNeighbor = hasFocus && neighborhood.neighborNodeIds.has(n.id);
      const r = n.kind === 'faction' ? 9 : 7;
      ctx.save();
      ctx.globalAlpha = !hasFocus || isCenter || isNeighbor ? 1 : dimAlpha;
      if (isCenter || isNeighbor || isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, r + (isCenter ? 6 : 4.5), 0, 2 * Math.PI, false);
        ctx.fillStyle = hexToRgba(colors.accentPrimary, isCenter ? 0.28 : 0.16);
        ctx.fill();
        if (isCenter || isNeighbor) {
          ctx.lineWidth = (isCenter ? 2.2 : 1.4) / Math.max(0.4, globalScale);
          ctx.strokeStyle = hexToRgba(colors.accentPrimary, isCenter ? 0.95 : 0.72);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      if (n.kind === 'faction') {
        for (let i = 0; i < 6; i += 1) {
          const a = (Math.PI / 3) * i;
          if (i === 0) ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
          else ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        }
        ctx.closePath();
      } else if (n.kind === 'location') ctx.rect(x - r, y - r, r * 2, r * 2);
      else ctx.arc(x, y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = n.color;
      ctx.fill();
      ctx.lineWidth = (isSelected || isCenter ? 2.2 : 1.1) / Math.max(0.5, globalScale);
      ctx.strokeStyle = isSelected || isCenter ? colors.textPrimary : colors.bgCanvas;
      ctx.stroke();
      if (pinnedCoordsRef.current.has(n.id)) {
        ctx.beginPath();
        ctx.arc(x + r * 0.75, y - r * 0.75, 2.5, 0, 2 * Math.PI, false);
        ctx.fillStyle = colors.accentPrimary;
        ctx.fill();
      }
      ctx.font = `600 ${Math.max(10, 12 / globalScale)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      drawOutlinedText(ctx, n.name, x, y + r + 3, colors.bgCanvas, colors.textPrimary, 3, globalScale);
      ctx.restore();
    },
    [selectedNodeId, focusNodeId, neighborhood, dimAlpha, colors]
  );

  const paintLinkLabel = useCallback(
    (linkObj: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const l = linkObj as GraphLink;
      const start = l.source as GraphNode;
      const end = l.target as GraphNode;
      if (typeof start !== 'object' || typeof end !== 'object' || !start || !end) return;
      if (start.x === undefined || start.y === undefined || end.x === undefined || end.y === undefined) return;
      const hasFocus = focusNodeId !== null;
      const isIncident = !hasFocus || neighborhood.incidentLinkIds.has(l.id);
      ctx.save();
      ctx.globalAlpha = isIncident ? 1 : dimAlpha;
      ctx.font = `${Math.max(8, 10 / globalScale)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      drawOutlinedText(ctx, l.label, (start.x + end.x) / 2, (start.y + end.y) / 2 - 3, colors.bgCanvas, isIncident && hasFocus ? colors.textPrimary : colors.textSecondary, 2.5, globalScale);
      ctx.restore();
    },
    [focusNodeId, neighborhood, dimAlpha, colors]
  );

  const cameraActions = [
    { label: 'Zoom +', Icon: ZoomIn, onClick: () => fgRef.current && fgRef.current.zoom(Math.min(8, fgRef.current.zoom() * 1.28), 220) },
    { label: 'Zoom -', Icon: ZoomOut, onClick: () => fgRef.current && fgRef.current.zoom(Math.max(0.15, fgRef.current.zoom() / 1.28), 220) },
    { label: 'Enquadrar Grafo', Icon: Maximize2, onClick: () => fgRef.current?.zoomToFit(400, 48) },
  ];

  return (
    <div ref={containerRef} style={canvasWrapperStyle}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={colors.bgCanvas}
        nodeRelSize={6}
        cooldownTicks={settings.lowPowerMode ? 80 : 220}
        d3AlphaDecay={settings.lowPowerMode ? 0.045 : 0.022}
        d3VelocityDecay={0.32}
        onRenderFramePre={renderGridPre}
        linkWidth={(link) => {
          const l = link as GraphLink;
          const base = Math.max(1.5, (l.strength || 5) * 0.35);
          return focusNodeId && neighborhood.incidentLinkIds.has(l.id) ? base + 0.8 : base;
        }}
        linkColor={(link) => {
          const l = link as GraphLink;
          return getThemeEdgeColor(l.type, isLightLike, !focusNodeId || neighborhood.incidentLinkIds.has(l.id) ? 1 : dimAlpha);
        }}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        onNodeHover={(node) => {
          if (draggedNodeId) return;
          setHoveredNodeId(node ? String((node as GraphNode).id) : null);
        }}
        onBackgroundClick={() => onSelectNode('')}
        onNodeDrag={(node) => {
          const gNode = node as GraphNode;
          const id = String(gNode.id);
          setDraggedNodeId((prev) => (prev === id ? prev : id));
          setHoveredNodeId((prev) => (prev === id ? prev : id));
        }}
        onNodeDragEnd={(node) => {
          const gNode = node as GraphNode;
          setDraggedNodeId(null);
          if (gNode.x === undefined || gNode.y === undefined) return;
          gNode.fx = gNode.x;
          gNode.fy = gNode.y;
          pinnedCoordsRef.current.set(String(gNode.id), { x: gNode.x, y: gNode.y });
          onPinnedCountChange(nodes.filter((item) => pinnedCoordsRef.current.has(item.id)).length);
        }}
        onNodeClick={(node) => {
          const gNode = node as GraphNode;
          const id = String(gNode.id);
          const now = Date.now();
          if (lastClickRef.current && lastClickRef.current.nodeId === id && now - lastClickRef.current.at <= 320) {
            lastClickRef.current = null;
            onOpenDossier?.(gNode);
            return;
          }
          lastClickRef.current = { nodeId: id, at: now };
          onSelectNode(id);
        }}
        nodePointerAreaPaint={(nodeObj, paintColor, ctx) => {
          const n = nodeObj as GraphNode;
          ctx.fillStyle = paintColor;
          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, (n.kind === 'faction' ? 9 : 7) + 4, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        nodeCanvasObject={paintNode}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={paintLinkLabel}
      />

      {activeBannerNode && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--card-shadow)',
            padding: '5px 8px 5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11.5,
            color: 'var(--text-primary)',
          }}
        >
          <span>
            {draggedNodeId ? 'Arrastando em foco:' : 'Em foco:'}{' '}
            <strong>{activeBannerNode.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setDraggedNodeId(null);
              setHoveredNodeId(null);
              onSelectNode('');
            }}
            title="Limpar seleção e foco"
            aria-label="Limpar seleção e foco"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      <div style={{ ...floatingCardStyle, left: 14, padding: '8px 12px', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
        {LEGEND_ITEMS.map(({ label, color, shape }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: shape === 'circle' ? '50%' : 1, backgroundColor: color, clipPath: shape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' : undefined }} />
            {label}
          </span>
        ))}
      </div>

      <div role="toolbar" aria-label="Controles de câmera do grafo" style={{ ...floatingCardStyle, right: 14, padding: 4, gap: 4 }}>
        {cameraActions.map(({ label, Icon, onClick }) => (
          <button key={label} type="button" onClick={onClick} aria-label={label} title={label} style={cameraBtnStyle}>
            <Icon size={13} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const canvasWrapperStyle: CSSProperties = { flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, height: '100%', backgroundColor: 'var(--bg-canvas)' };
const floatingCardStyle: CSSProperties = { position: 'absolute', bottom: 14, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md, 8px)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center' };
const cameraBtnStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 28, padding: '5px 9px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' };
