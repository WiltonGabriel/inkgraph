import { useState } from 'react';
import type { MindMap, MindMapNode } from '../../types/project';

interface MindMapCanvasSvgProps {
  map: MindMap;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onMoveNode: (nodeId: string, dx: number, dy: number) => void;
}

function renderShape(node: MindMapNode, isSelected: boolean) {
  const stroke = isSelected ? '#ffffff' : node.color;
  const strokeWidth = isSelected ? 2.5 : 1.5;
  const fill = `${node.color}33`;

  switch (node.shape) {
    case 'circle':
      return <circle cx={0} cy={0} r={42} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    case 'ellipse':
      return <ellipse cx={0} cy={0} rx={62} ry={34} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    case 'diamond':
      return (
        <polygon
          points="0,-44 64,0 0,44 -64,0"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'hexagon':
      return (
        <polygon
          points="-56,0 -28,-36 28,-36 56,0 28,36 -28,36"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'rectangle':
    default:
      return (
        <rect
          x={-62}
          y={-28}
          width={124}
          height={56}
          rx={8}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
  }
}

export function MindMapCanvasSvg({
  map,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
}: MindMapCanvasSvgProps) {
  const [zoom, setZoom] = useState(1);

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#0b0f18',
        border: '1px solid #242f44',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 5,
          display: 'flex',
          gap: 6,
          backgroundColor: '#111622',
          padding: 4,
          borderRadius: 6,
          border: '1px solid #242f44',
        }}
      >
        <button onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))} style={zoomBtnStyle}>
          +
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))} style={zoomBtnStyle}>
          -
        </button>
        <button onClick={() => setZoom(1)} style={zoomBtnStyle}>
          Redefinir
        </button>
      </div>

      <svg viewBox="0 0 900 580" style={{ width: '100%', height: '100%' }}>
        <defs>
          <marker id="mmArrowEnd" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
          </marker>
          <marker id="mmArrowStart" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto">
            <path d="M8,0 L0,4 L8,8 Z" fill="#94a3b8" />
          </marker>
        </defs>

        <g transform={`scale(${zoom})`}>
          {map.edges.map((edge) => {
            const from = map.nodes.find((n) => n.id === edge.fromNodeId);
            const to = map.nodes.find((n) => n.id === edge.toNodeId);
            if (!from || !to) return null;
            return (
              <g key={edge.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeDasharray={edge.style === 'dotted' ? '5 5' : undefined}
                  markerEnd="url(#mmArrowEnd)"
                  markerStart={edge.direction === 'bi' ? 'url(#mmArrowStart)' : undefined}
                />
                {edge.label && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 6}
                    fill="#cbd5e1"
                    fontSize={10.5}
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {map.nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectNode(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {renderShape(node, isSelected)}
                <text y={4} fill="#f8fafc" fontSize={11.5} fontWeight={700} textAnchor="middle">
                  {node.label}
                </text>
                {node.type === 'linked' && (
                  <text y={18} fill="#93c5fd" fontSize={9} textAnchor="middle">
                    [{node.linkedEntityKind}]
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {selectedNodeId && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            display: 'flex',
            gap: 4,
            backgroundColor: '#111622',
            padding: 5,
            borderRadius: 6,
            border: '1px solid #242f44',
          }}
        >
          <button onClick={() => onMoveNode(selectedNodeId, -25, 0)} style={zoomBtnStyle}>←</button>
          <button onClick={() => onMoveNode(selectedNodeId, 0, -25)} style={zoomBtnStyle}>↑</button>
          <button onClick={() => onMoveNode(selectedNodeId, 0, 25)} style={zoomBtnStyle}>↓</button>
          <button onClick={() => onMoveNode(selectedNodeId, 25, 0)} style={zoomBtnStyle}>→</button>
        </div>
      )}
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  padding: '4px 9px',
  borderRadius: 5,
  backgroundColor: '#182030',
  color: '#e2e8f0',
  fontSize: 11.5,
  fontWeight: 600,
};
