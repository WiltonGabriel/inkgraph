import { useRef, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { REL_COLORS, type GraphNode, type GraphLink } from './graphDataBuilder';

interface GraphCanvas2DProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
}

export function GraphCanvas2D({
  nodes,
  links,
  selectedNodeId,
  onSelectNode,
}: GraphCanvas2DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 760, height: 640 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: Math.max(360, containerRef.current.clientWidth),
          height: Math.max(420, containerRef.current.clientHeight),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}
    >
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        backgroundColor="#080a0f"
        nodeRelSize={6}
        linkWidth={(link) => Math.max(1.5, ((link as GraphLink).strength || 5) * 0.35)}
        linkColor={(link) => REL_COLORS[(link as GraphLink).type] ?? '#4b5563'}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => {
          onSelectNode(String((node as GraphNode).id));
        }}
        nodeCanvasObject={(nodeObj, ctx, globalScale) => {
          const n = nodeObj as GraphNode;
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          const isSelected = n.id === selectedNodeId;
          const r = n.kind === 'faction' ? 9 : 7;

          if (isSelected) {
            ctx.beginPath();
            ctx.arc(x, y, r + 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(96, 165, 250, 0.28)';
            ctx.fill();
          }

          ctx.beginPath();
          if (n.kind === 'faction') {
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i;
              const hx = x + r * Math.cos(angle);
              const hy = y + r * Math.sin(angle);
              if (i === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
          } else if (n.kind === 'location') {
            ctx.rect(x - r, y - r, r * 2, r * 2);
          } else {
            ctx.arc(x, y, r, 0, 2 * Math.PI, false);
          }
          ctx.fillStyle = n.color;
          ctx.fill();
          ctx.lineWidth = isSelected ? 2.2 : 1;
          ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
          ctx.stroke();

          const fontSize = Math.max(10, 12 / globalScale);
          ctx.font = `600 ${fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#f3f4f6';
          ctx.fillText(n.name, x, y + r + 3);
        }}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(linkObj, ctx, globalScale) => {
          const l = linkObj as GraphLink;
          const start = l.source as GraphNode;
          const end = l.target as GraphNode;
          if (typeof start !== 'object' || typeof end !== 'object') return;
          if (
            start.x === undefined ||
            start.y === undefined ||
            end.x === undefined ||
            end.y === undefined
          )
            return;
          const mx = (start.x + end.x) / 2;
          const my = (start.y + end.y) / 2;
          const fontSize = Math.max(8, 10 / globalScale);
          ctx.font = `${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'center';
          ctx.fillText(l.label, mx, my - 3);
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          padding: '8px 12px',
          backgroundColor: 'rgba(13, 17, 26, 0.9)',
          border: '1px solid #22293a',
          borderRadius: 8,
          display: 'flex',
          gap: 12,
          fontSize: 11,
          color: '#d1d5db',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
          Personagem
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, backgroundColor: '#ef4444', transform: 'rotate(45deg)' }} />
          Facção
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, backgroundColor: '#10b981' }} />
          Local
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#a855f7' }} />
          Sistema
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          Objeto
        </span>
      </div>
    </div>
  );
}
