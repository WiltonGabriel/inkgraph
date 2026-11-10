import { useMemo } from 'react';
import { Shield, Plus, Sparkles, Search } from 'lucide-react';
import {
  calculateFactionCompleteness,
  type Faction,
} from '../../types/project';
import { CompletenessRing } from '../ui/CompletenessRing';

interface FactionRosterSidebarProps {
  factions: Faction[];
  filteredFactions: Faction[];
  selectedId: string;
  onSelectId: (id: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  onCreateFaction: (withAi: boolean) => void;
}

export function FactionRosterSidebar({
  factions,
  filteredFactions,
  selectedId,
  onSelectId,
  search,
  onSearchChange,
  onCreateFaction,
}: FactionRosterSidebarProps) {
  const avgCompleteness = useMemo(() => {
    if (factions.length === 0) return 0;
    const sum = factions.reduce(
      (acc, f) => acc + calculateFactionCompleteness(f),
      0
    );
    return Math.round(sum / factions.length);
  }, [factions]);

  return (
    <div
      style={{
        width: 340,
        backgroundColor: '#0e1118',
        borderRight: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 14, borderBottom: '1px solid #1b202c' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 14,
              fontWeight: 700,
              color: '#f3f4f6',
            }}
          >
            <Shield size={16} color="#ef4444" /> Facções & Ordens
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onCreateFaction(false)}
              style={{
                padding: '5px 8px',
                backgroundColor: '#1a2030',
                border: '1px solid #2c3548',
                borderRadius: 6,
                color: '#e5e7eb',
                fontSize: 11.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={13} /> Nova
            </button>
            <button
              onClick={() => onCreateFaction(true)}
              style={{
                padding: '5px 8px',
                backgroundColor: 'rgba(167,139,250,0.15)',
                border: '1px solid rgba(167,139,250,0.35)',
                borderRadius: 6,
                color: '#c4b5fd',
                fontSize: 11.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={13} /> IA
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            marginBottom: 10,
            fontSize: 11,
          }}
        >
          <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
            <div style={{ color: '#9ca3af' }}>Total de Facções</div>
            <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: 13 }}>
              {factions.length}
            </div>
          </div>
          <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
            <div style={{ color: '#9ca3af' }}>Média completa</div>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>
              {avgCompleteness}%
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            color="#6b7280"
            style={{ position: 'absolute', left: 8, top: 8 }}
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar facções..."
            style={{
              width: '100%',
              padding: '6px 8px 6px 26px',
              backgroundColor: '#141824',
              border: '1px solid #242b3d',
              borderRadius: 6,
              color: '#f3f4f6',
              fontSize: 12,
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {filteredFactions.map((f) => {
          const pct = calculateFactionCompleteness(f);
          const active = selectedId === f.id;
          return (
            <div
              key={f.id}
              onClick={() => onSelectId(f.id)}
              style={{
                padding: '10px 12px',
                backgroundColor: active ? '#172033' : '#131722',
                border: active ? '1px solid #ef4444' : '1px solid #1f2533',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.subtype}</div>
              </div>
              <CompletenessRing percent={pct} size={36} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
