import { useMemo } from 'react';
import { Users, Plus, Sparkles, Search } from 'lucide-react';
import {
  calculateCharacterCompleteness,
  type Character,
} from '../../types/project';
import { CompletenessRing } from '../ui/CompletenessRing';

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
            <Users size={16} color="#60a5fa" /> Dossiês de Personagens
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onCreateManual}
              title="Adicionar manualmente"
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
              <Plus size={13} /> Novo
            </button>
            <button
              onClick={onOpenAiModal}
              title="Gerar com IA"
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginBottom: 10,
            fontSize: 11,
          }}
        >
          <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
            <div style={{ color: '#9ca3af' }}>Total</div>
            <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: 13 }}>
              {characters.length}
            </div>
          </div>
          <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
            <div style={{ color: '#9ca3af' }}>Média compl.</div>
            <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 13 }}>
              {avgCompleteness}%
            </div>
          </div>
          <div style={{ padding: '6px 8px', backgroundColor: '#141824', borderRadius: 6 }}>
            <div style={{ color: '#9ca3af' }}>Desenvolvidos</div>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>
              {developedCount}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={13}
              color="#6b7280"
              style={{ position: 'absolute', left: 8, top: 8 }}
            />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisar personagens..."
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
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
            style={{
              backgroundColor: '#141824',
              border: '1px solid #242b3d',
              borderRadius: 6,
              color: '#d1d5db',
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
                backgroundColor: active ? '#172033' : '#131722',
                border: active ? '1px solid #3b82f6' : '1px solid #1f2533',
                borderRadius: 8,
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
                      color: '#f3f4f6',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {c.role} · <span style={{ color: '#60a5fa' }}>{c.archetype}</span>
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
