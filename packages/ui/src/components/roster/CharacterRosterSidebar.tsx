import { useMemo, useState } from 'react';
import { Users, Plus, Sparkles, Search } from 'lucide-react';
import {
  calculateCharacterCompleteness,
  type Character,
} from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { checkAiAvailability } from '../../domain/aiAvailability';
import { CompletenessRing } from '../ui/CompletenessRing';
import { SubtleAiGatePopover } from '../common/SubtleAiGatePopover';

interface CharacterRosterSidebarProps {
  characters: Character[];
  filteredCharacters: Character[];
  selectedId: string;
  onSelectId: (id: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  sortBy: 'name' | 'completeDesc' | 'completeAsc';
  onSortChange: (s: 'name' | 'completeDesc' | 'completeAsc') => void;
  onCreateManual: () => void;
  onOpenAiModal: () => void;
}

export function CharacterRosterSidebar({
  characters,
  filteredCharacters,
  selectedId,
  onSelectId,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  onCreateManual,
  onOpenAiModal,
}: CharacterRosterSidebarProps) {
  const { settings } = useProject();
  const [aiGateOpen, setAiGateOpen] = useState(false);
  const aiStatus = checkAiAvailability(settings);

  const avgCompleteness = useMemo(() => {
    if (characters.length === 0) return 0;
    const sum = characters.reduce(
      (acc, c) => acc + calculateCharacterCompleteness(c),
      0
    );
    return Math.round(sum / characters.length);
  }, [characters]);

  const developedCount = characters.filter(
    (c) => calculateCharacterCompleteness(c) >= 80
  ).length;

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
            <Users size={16} style={{ color: 'var(--accent-primary, #3b82f6)' }} /> Dossiês de Personagens
          </span>
          <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
            <button
              type="button"
              onClick={onCreateManual}
              title="Adicionar manualmente"
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
              <Plus size={13} /> Novo
            </button>
            <button
              type="button"
              onClick={handleAiClick}
              title={
                aiStatus.connected
                  ? 'Gerar com IA'
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
            gridTemplateColumns: 'repeat(3, 1fr)',
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
            <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Total</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', fontSize: 13 }}>
              {characters.length}
            </div>
          </div>
          <div
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Média compl.</div>
            <div style={{ fontWeight: 700, color: 'var(--accent-primary, #3b82f6)', fontSize: 13 }}>
              {avgCompleteness}%
            </div>
          </div>
          <div
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Desenvolvidos</div>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>
              {developedCount}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, position: 'relative' }}>
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
              placeholder="Pesquisar personagens..."
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
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
            style={{
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 11,
              padding: '0 6px',
            }}
          >
            <option value="completeDesc">Mais completo</option>
            <option value="completeAsc">Menos completo</option>
            <option value="name">Nome (A–Z)</option>
          </select>
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
        {filteredCharacters.map((c) => {
          const pct = calculateCharacterCompleteness(c);
          const active = selectedId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => onSelectId(c.id)}
              style={{
                padding: '10px 12px',
                backgroundColor: active
                  ? 'var(--bg-hover, #1f273d)'
                  : 'var(--bg-elevated, #171d2e)',
                border: active
                  ? '1px solid var(--accent-primary, #3b82f6)'
                  : '1px solid var(--border-subtle, #263046)',
                borderRadius: 'var(--radius-md, 8px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: c.avatarColor || '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary, #f1f5f9)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                    {c.role} · <span style={{ color: 'var(--accent-primary, #3b82f6)' }}>{c.archetype}</span>
                  </div>
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
