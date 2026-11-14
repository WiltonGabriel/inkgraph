import { useMemo, useState } from 'react';
import { Shield, Plus, Sparkles, Search } from 'lucide-react';
import {
  calculateFactionCompleteness,
  type Faction,
} from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { checkAiAvailability } from '../../domain/aiAvailability';
import { CompletenessRing } from '../ui/CompletenessRing';
import { SubtleAiGatePopover } from '../common/SubtleAiGatePopover';

interface FactionRosterSidebarProps {
  factions: Faction[];
  filteredFactions: Faction[];
  selectedId: string;
  onSelectId: (id: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  onCreateManual: () => void;
  onOpenAiModal: () => void;
}

export function FactionRosterSidebar({
  factions,
  filteredFactions,
  selectedId,
  onSelectId,
  search,
  onSearchChange,
  onCreateManual,
  onOpenAiModal,
}: FactionRosterSidebarProps) {
  const { settings } = useProject();
  const [aiGateOpen, setAiGateOpen] = useState(false);
  const aiStatus = checkAiAvailability(settings);

  const avgCompleteness = useMemo(() => {
    if (factions.length === 0) return 0;
    const sum = factions.reduce(
      (acc, f) => acc + calculateFactionCompleteness(f),
      0
    );
    return Math.round(sum / factions.length);
  }, [factions]);

  const handleAiClick = () => {
    if (!aiStatus.connected) {
      setAiGateOpen((prev) => !prev);
      return;
    }
    onOpenAiModal();
  };

  return (
    <div
      style={{
        width: 340,
        backgroundColor: 'var(--bg-surface, #111623)',
        borderRight: '1px solid var(--border-subtle, #263046)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 14, borderBottom: '1px solid var(--border-subtle, #263046)' }}>
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
              color: 'var(--text-primary, #f1f5f9)',
            }}
          >
            <Shield size={16} color="#ef4444" /> Facções & Ordens
          </span>
          <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
            <button
              type="button"
              onClick={onCreateManual}
              style={{
                padding: '5px 8px',
                backgroundColor: 'var(--bg-elevated, #171d2e)',
                border: '1px solid var(--border-subtle, #263046)',
                borderRadius: 'var(--radius-sm, 6px)',
                color: 'var(--text-primary, #f1f5f9)',
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
              type="button"
              onClick={handleAiClick}
              title={
                aiStatus.connected
                  ? 'Gerar facção com IA'
                  : 'Nenhuma IA conectada — clique para configurar'
              }
              style={{
                padding: '5px 8px',
                backgroundColor: aiStatus.connected
                  ? 'rgba(167,139,250,0.16)'
                  : 'var(--bg-elevated, #171d2e)',
                border: aiStatus.connected
                  ? '1px solid rgba(167,139,250,0.38)'
                  : '1px dashed var(--border-subtle, #263046)',
                borderRadius: 'var(--radius-sm, 6px)',
                color: aiStatus.connected ? '#a78bfa' : 'var(--text-muted, #64748b)',
                fontSize: 11.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={13} /> IA
            </button>

            <SubtleAiGatePopover
              open={aiGateOpen}
              onClose={() => setAiGateOpen(false)}
              align="left"
            />
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
          <div
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Total de Facções</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', fontSize: 13 }}>
              {factions.length}
            </div>
          </div>
          <div
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Média completa</div>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>
              {avgCompleteness}%
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 8,
              top: 8,
              color: 'var(--text-muted, #64748b)',
            }}
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar facções..."
            style={{
              width: '100%',
              padding: '6px 8px 6px 26px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary, #f1f5f9)',
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
                backgroundColor: active
                  ? 'var(--bg-hover, #1f273d)'
                  : 'var(--bg-elevated, #171d2e)',
                border: active
                  ? '1px solid #ef4444'
                  : '1px solid var(--border-subtle, #263046)',
                borderRadius: 'var(--radius-md, 8px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                  {f.subtype}
                </div>
              </div>
              <CompletenessRing percent={pct} size={36} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
