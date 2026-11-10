import { Network, Table, Shield, Users, MapPin, Cpu } from 'lucide-react';
import type { ScopeFilter } from './graphDataBuilder';

interface GraphToolbarProps {
  scope: ScopeFilter;
  setScope: (s: ScopeFilter) => void;
  viewMode: 'graph' | 'table';
  setViewMode: (m: 'graph' | 'table') => void;
  nodeCount: number;
  linkCount: number;
}

export function GraphToolbar({
  scope,
  setScope,
  viewMode,
  setViewMode,
  nodeCount,
  linkCount,
}: GraphToolbarProps) {
  return (
    <div
      style={{
        padding: '10px 16px',
        backgroundColor: '#0e121b',
        borderBottom: '1px solid #1b202c',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Visão Completa', icon: Network, color: '#60a5fa' },
          { id: 'character', label: 'Só Personagens', icon: Users, color: '#3b82f6' },
          { id: 'faction', label: 'Só Facções', icon: Shield, color: '#ef4444' },
          { id: 'location', label: 'Só Locais & Rotas', icon: MapPin, color: '#10b981' },
          { id: 'system_object', label: 'Sistemas & Objetos', icon: Cpu, color: '#a855f7' },
        ].map((btn) => {
          const Icon = btn.icon;
          const active = scope === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setScope(btn.id as ScopeFilter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                borderRadius: 6,
                border: active ? `1px solid ${btn.color}` : '1px solid #232a3b',
                backgroundColor: active ? 'rgba(59, 130, 246, 0.14)' : '#141824',
                color: active ? '#f9fafb' : '#9ca3af',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              <Icon size={13} color={btn.color} />
              {btn.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11.5, color: '#6b7280', marginRight: 4 }}>
          {nodeCount} nós · {linkCount} vínculos
        </span>
        <button
          onClick={() => setViewMode('graph')}
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid #262e40',
            backgroundColor: viewMode === 'graph' ? '#2563eb' : '#141824',
            color: '#fff',
            fontSize: 11.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Network size={13} /> Gráfico
        </button>
        <button
          onClick={() => setViewMode('table')}
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid #262e40',
            backgroundColor: viewMode === 'table' ? '#2563eb' : '#141824',
            color: '#fff',
            fontSize: 11.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Table size={13} /> Tabela
        </button>
      </div>
    </div>
  );
}
