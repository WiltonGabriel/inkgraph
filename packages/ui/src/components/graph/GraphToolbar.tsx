import { Network, Table, Shield, Users, MapPin, Cpu, Unlock } from 'lucide-react';
import type { ScopeFilter } from './graphDataBuilder';

interface GraphToolbarProps {
  scope: ScopeFilter;
  setScope: (s: ScopeFilter) => void;
  viewMode: 'graph' | 'table';
  setViewMode: (m: 'graph' | 'table') => void;
  nodeCount: number;
  linkCount: number;
  repulsionStrength: number;
  setRepulsionStrength: (value: number) => void;
  pinnedCount: number;
  onReleasePinnedNodes: () => void;
}

const SCOPE_OPTIONS: {
  id: ScopeFilter;
  label: string;
  icon: typeof Network;
  color: string;
}[] = [
  { id: 'all', label: 'Visão Completa', icon: Network, color: '#3b82f6' },
  { id: 'character', label: 'Só Personagens', icon: Users, color: '#3b82f6' },
  { id: 'faction', label: 'Só Facções', icon: Shield, color: '#ef4444' },
  { id: 'location', label: 'Só Locais & Rotas', icon: MapPin, color: '#10b981' },
  { id: 'system_object', label: 'Sistemas & Objetos', icon: Cpu, color: '#a855f7' },
];

export function GraphToolbar({
  scope,
  setScope,
  viewMode,
  setViewMode,
  nodeCount,
  linkCount,
  repulsionStrength,
  setRepulsionStrength,
  pinnedCount,
  onReleasePinnedNodes,
}: GraphToolbarProps) {
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
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SCOPE_OPTIONS.map((btn) => {
          const Icon = btn.icon;
          const active = scope === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              aria-pressed={active}
              onClick={() => setScope(btn.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: active
                  ? `1px solid ${btn.color}`
                  : '1px solid var(--border-subtle)',
                backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <Icon size={13} color={btn.color} aria-hidden="true" />
              {btn.label}
            </button>
          );
        })}
      </div>

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
