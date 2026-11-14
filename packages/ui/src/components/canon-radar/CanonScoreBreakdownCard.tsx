import { useState, useMemo } from 'react';
import { Globe, ChevronDown, ChevronRight, ArrowUpRight, Layers } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  WORLD_PILLARS,
  type EntityCanonScoreItem,
  type ProjectCanonScoreSummary,
} from '../../domain/canonScoreCalculator';
import type { ViewId } from '../../types/project';
import { canonCardStyle, canonCardHeaderStyle, canonCardTitleStyle } from './canonRadarStyles';

type EntityKindFilter = 'all' | EntityCanonScoreItem['kind'];

const KIND_LABELS: Record<EntityCanonScoreItem['kind'], string> = {
  character: 'Personagem',
  faction: 'Facção',
  location: 'Local',
  system: 'Sistema',
  object: 'Objeto',
};

const KIND_VIEW: Record<EntityCanonScoreItem['kind'], ViewId> = {
  character: 'characters',
  faction: 'factions',
  location: 'worlds',
  system: 'worlds',
  object: 'objects',
};

interface CanonScoreBreakdownCardProps {
  scoreSummary: ProjectCanonScoreSummary;
}

export function CanonScoreBreakdownCard({ scoreSummary }: CanonScoreBreakdownCardProps) {
  const { navigateToBreadcrumbPath, setActiveView } = useProject();
  const [kindFilter, setKindFilter] = useState<EntityKindFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const sortedEntities = useMemo(() => {
    const filtered =
      kindFilter === 'all'
        ? scoreSummary.entities
        : scoreSummary.entities.filter((e) => e.kind === kindFilter);
    return [...filtered].sort(
      (a, b) => a.badge.score - b.badge.score || a.name.localeCompare(b.name, 'pt-BR')
    );
  }, [scoreSummary.entities, kindFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const worldReport = scoreSummary.worldReport;
  const filterTabs: { id: EntityKindFilter; label: string }[] = [
    { id: 'all', label: `Todos (${scoreSummary.entities.length})` },
    { id: 'character', label: 'Personagens' },
    { id: 'faction', label: 'Facções' },
    { id: 'location', label: 'Locais' },
    { id: 'system', label: 'Sistemas' },
    { id: 'object', label: 'Objetos' },
  ];

  return (
    <section style={canonCardStyle}>
      <div style={canonCardHeaderStyle}>
        <span style={canonCardTitleStyle}>
          <Globe size={15} style={{ color: '#10b981' }} />
          Detalhamento de Maturidade (1–10) · Pilares do Mundo & Entidades
        </span>
        {worldReport && (
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
            Mundo: <strong>{worldReport.worldName}</strong> ({worldReport.overallScore.score}/10)
          </span>
        )}
      </div>

      {worldReport ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
            gap: 9,
          }}
        >
          {WORLD_PILLARS.map((meta) => {
            const badge = worldReport.pillars[meta.id];
            return (
              <button
                key={meta.id}
                type="button"
                onClick={() =>
                  navigateToBreadcrumbPath(
                    `InkGraph / Mundo & Lore / Construção Mundial / ${meta.subPath}`
                  )
                }
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                    {meta.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '1px 7px',
                      borderRadius: 999,
                      backgroundColor: `${badge.color}22`,
                      color: badge.color,
                      border: `1px solid ${badge.color}55`,
                    }}
                  >
                    {badge.score}/10
                  </span>
                </div>

                <div style={{ fontSize: 10.5, color: 'var(--text-secondary, #94a3b8)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{badge.label}</span>
                  <span>
                    {badge.filledCount}/{badge.totalCount}
                  </span>
                </div>

                {badge.missingItems.length > 0 ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 14,
                      fontSize: 11,
                      color: 'var(--text-secondary, #94a3b8)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {badge.missingItems.slice(0, 2).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    {badge.missingItems.length > 2 && (
                      <li>+{badge.missingItems.length - 2} pendente(s)</li>
                    )}
                  </ul>
                ) : (
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                    Critérios completos
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: 14,
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            fontSize: 12,
            color: 'var(--text-secondary, #94a3b8)',
          }}
        >
          Nenhum mundo cadastrado para avaliar os 10 pilares.
        </div>
      )}

      <div
        style={{
          marginTop: 6,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
            <Layers size={14} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
            Entidades Ordenadas do Menor para o Maior Score (1–10)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {filterTabs.map((tab) => {
              const selected = kindFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setKindFilter(tab.id)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: selected
                      ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
                      : 'var(--bg-elevated, var(--bg-card, #171d2e))',
                    color: selected
                      ? 'var(--accent-primary, #3b82f6)'
                      : 'var(--text-secondary, #94a3b8)',
                    border: selected
                      ? '1px solid var(--accent-primary, #3b82f6)'
                      : '1px solid var(--border-subtle, var(--border, #263046))',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortedEntities.map((ent) => {
            const isExpanded = Boolean(expandedIds[ent.id]);
            return (
              <div
                key={`${ent.kind}_${ent.id}`}
                style={{
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(ent.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-primary, #f1f5f9)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>{ent.name}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-secondary, #94a3b8)' }}>
                      {KIND_LABELS[ent.kind]} · {ent.status}
                    </span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                      {ent.badge.filledCount}/{ent.badge.totalCount} itens
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 999,
                        backgroundColor: `${ent.badge.color}22`,
                        color: ent.badge.color,
                        border: `1px solid ${ent.badge.color}55`,
                      }}
                    >
                      {ent.badge.score}/10 · {ent.badge.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveView(KIND_VIEW[ent.kind])}
                      title={`Abrir ${KIND_LABELS[ent.kind]}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '3px 7px',
                        borderRadius: 5,
                        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
                        border: '1px solid var(--border-subtle, var(--border, #263046))',
                        color: 'var(--text-secondary, #94a3b8)',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Abrir <ArrowUpRight size={11} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: '8px 14px 10px 30px',
                      borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
                      backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
                      fontSize: 11.5,
                      color: 'var(--text-secondary, #94a3b8)',
                    }}
                  >
                    {ent.badge.missingItems.length === 0 ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        Todos os critérios mínimos de cânone atendidos.
                      </span>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {ent.badge.missingItems.map((missing) => (
                          <li key={missing}>{missing}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
