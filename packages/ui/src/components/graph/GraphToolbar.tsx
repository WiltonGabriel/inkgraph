import { useState } from 'react';
import {
  CheckSquare,
  Cpu,
  Filter,
  MapPin,
  Network,
  Package,
  Shield,
  Square,
  Table,
  Unlock,
  Users,
} from 'lucide-react';
import {
  ALL_GRAPH_ENTITY_KINDS,
  type GraphEntityKind,
} from './graphDataBuilder';

interface GraphToolbarProps {
  enabledKinds: GraphEntityKind[];
  onToggleKind: (kind: GraphEntityKind) => void;
  onSelectAllKinds: () => void;
  viewMode: 'graph' | 'table';
  setViewMode: (m: 'graph' | 'table') => void;
  nodeCount: number;
  linkCount: number;
  repulsionStrength: number;
  setRepulsionStrength: (value: number) => void;
  pinnedCount: number;
  onReleasePinnedNodes: () => void;
}

const FILTER_LAYERS: {
  kind: GraphEntityKind;
  label: string;
  icon: typeof Users;
  color: string;
}[] = [
  { kind: 'character', label: 'Personagens', icon: Users, color: '#3b82f6' },
  { kind: 'faction', label: 'Facções', icon: Shield, color: '#ef4444' },
  { kind: 'location', label: 'Locais', icon: MapPin, color: '#10b981' },
  { kind: 'system', label: 'Sistemas', icon: Cpu, color: '#a855f7' },
  { kind: 'object', label: 'Objetos', icon: Package, color: '#f59e0b' },
];

export function GraphToolbar({
  enabledKinds,
  onToggleKind,
  onSelectAllKinds,
  viewMode,
  setViewMode,
  nodeCount,
  linkCount,
  repulsionStrength,
  setRepulsionStrength,
  pinnedCount,
  onReleasePinnedNodes,
}: GraphToolbarProps) {
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const enabledSet = new Set(enabledKinds);
  const allChecked = enabledKinds.length === ALL_GRAPH_ENTITY_KINDS.length;

  return (
    <div
      style={{
        padding: '10px 16px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      {/* Controles físicos à esquerda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {viewMode === 'graph' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <label
                htmlFor="graph-repulsion-range"
                style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}
              >
                Repulsão
              </label>
              <input
                id="graph-repulsion-range"
                type="range"
                min={150}
                max={900}
                step={10}
                value={repulsionStrength}
                onChange={(e) => setRepulsionStrength(Number(e.target.value))}
                style={{ width: 88, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  minWidth: 28,
                  textAlign: 'right',
                }}
              >
                {repulsionStrength}
              </span>
            </div>

            <button
              type="button"
              onClick={onReleasePinnedNodes}
              disabled={pinnedCount === 0}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: pinnedCount > 0 ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                color: pinnedCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: pinnedCount > 0 ? 'pointer' : 'not-allowed',
                opacity: pinnedCount > 0 ? 1 : 0.65,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Unlock size={12} aria-hidden="true" />
              Soltar Nós Fixados{pinnedCount > 0 ? ` (${pinnedCount})` : ''}
            </button>
          </>
        )}

        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          {nodeCount} nós · {linkCount} vínculos
        </span>
      </div>

      {/* Filtro de camadas marcáveis + Alternância Gráfico / Tabela lado a lado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div
          role="group"
          aria-label="Filtro de camadas do grafo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap',
            padding: '3px 6px',
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterPopoverOpen((prev) => !prev)}
            aria-expanded={filterPopoverOpen}
            title="Abrir menu de filtro para marcar ou desmarcar camadas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 7px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: 'none',
              backgroundColor: filterPopoverOpen ? 'var(--accent-soft)' : 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Filter size={12} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            <span>
              Filtro ({enabledKinds.length}/{ALL_GRAPH_ENTITY_KINDS.length})
            </span>
          </button>

          {FILTER_LAYERS.map((layer) => {
            const checked = enabledSet.has(layer.kind);
            const CheckIcon = checked ? CheckSquare : Square;
            return (
              <button
                key={layer.kind}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onToggleKind(layer.kind)}
                title={`${checked ? 'Desmarcar' : 'Marcar'} ${layer.label}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm, 5px)',
                  border: checked
                    ? `1px solid ${layer.color}`
                    : '1px solid var(--border-subtle)',
                  backgroundColor: checked ? 'var(--bg-surface)' : 'transparent',
                  color: checked ? 'var(--text-primary)' : 'var(--text-muted)',
                  opacity: checked ? 1 : 0.6,
                  fontSize: 11.5,
                  fontWeight: checked ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                <CheckIcon size={12} color={checked ? layer.color : 'var(--text-muted)'} />
                <span>{layer.label}</span>
              </button>
            );
          })}

          {!allChecked && (
            <button
              type="button"
              onClick={onSelectAllKinds}
              title="Marcar todas as camadas (Visão Completa)"
              style={{
                padding: '3px 7px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--accent-primary)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Marcar Todos
            </button>
          )}

          {filterPopoverOpen && (
            <div
              role="dialog"
              aria-label="Selecionar camadas visíveis no grafo"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                zIndex: 80,
                minWidth: 230,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Filtrar Entidades no Grafo
                </span>
                <button
                  type="button"
                  onClick={onSelectAllKinds}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Visão Completa
                </button>
              </div>
              {FILTER_LAYERS.map((layer) => {
                const checked = enabledSet.has(layer.kind);
                const Icon = layer.icon;
                return (
                  <label
                    key={layer.kind}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-sm, 5px)',
                      backgroundColor: checked ? 'var(--bg-elevated)' : 'transparent',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleKind(layer.kind)}
                        style={{ accentColor: layer.color, cursor: 'pointer' }}
                      />
                      <Icon size={13} color={layer.color} />
                      <span>{layer.label}</span>
                    </span>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: layer.color,
                      }}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 5 }}>
          <button
            type="button"
            aria-pressed={viewMode === 'graph'}
            onClick={() => setViewMode('graph')}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
              backgroundColor:
                viewMode === 'graph' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: viewMode === 'graph' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Network size={13} aria-hidden="true" /> Gráfico
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'table'}
            onClick={() => setViewMode('table')}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
              backgroundColor:
                viewMode === 'table' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Table size={13} aria-hidden="true" /> Tabela
          </button>
        </div>
      </div>
    </div>
  );
}
