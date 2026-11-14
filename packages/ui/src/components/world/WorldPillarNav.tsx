import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Compass,
  Cpu,
  Globe,
  History,
  Map as MapIcon,
  MapPin,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { useViewport } from '../../hooks/useViewport';
import { WORLD_PILLARS, type CanonScoreBadgeInfo, type WorldPillarId } from '../../domain/canonScoreCalculator';
import { CanonBadgePill } from './WorldScoreChecklistBanner';

const PILLAR_ICONS: Record<WorldPillarId, LucideIcon> = {
  overview: Globe,
  geography: Compass,
  culture: BookOpen,
  politics: Shield,
  economy: Coins,
  history: History,
  locations: MapPin,
  atlas: MapIcon,
  systems: Cpu,
  timeline: Clock,
};

interface WorldPillarNavProps {
  activePillar: WorldPillarId;
  onSelectPillar: (pillar: WorldPillarId) => void;
  pillarScores: Record<WorldPillarId, CanonScoreBadgeInfo>;
}

/**
 * Adaptive navigation for the 10 worldbuilding pillars:
 * - width >= 960: collapsible vertical sidebar (215px expanded, 56px icon-only collapsed)
 * - width < 960: single-row horizontally scrollable pill bar with short labels and 1-10 badges
 */
export function WorldPillarNav({ activePillar, onSelectPillar, pillarScores }: WorldPillarNavProps) {
  const { width } = useViewport();
  const isCompact = width < 960;
  const [collapsed, setCollapsed] = useState(false);
  const pillRefs = useRef<Partial<Record<WorldPillarId, HTMLButtonElement | null>>>({});

  useEffect(() => {
    if (!isCompact) return;
    pillRefs.current[activePillar]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activePillar, isCompact]);

  if (isCompact) {
    return (
      <nav
        aria-label="Pilares de construção mundial"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          backgroundColor: 'var(--bg-surface, #111623)',
          borderBottom: '1px solid var(--border-subtle, #263046)',
          flexShrink: 0,
        }}
      >
        {WORLD_PILLARS.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.id];
          const badge = pillarScores[pillar.id];
          const isActive = activePillar === pillar.id;
          return (
            <button
              key={pillar.id}
              ref={(el) => {
                pillRefs.current[pillar.id] = el;
              }}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectPillar(pillar.id)}
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: isActive ? '1px solid var(--accent-primary, #3b82f6)' : '1px solid var(--border-subtle, #263046)',
                borderBottomWidth: isActive ? 3 : 1,
                backgroundColor: isActive ? 'var(--bg-elevated, #171d2e)' : 'transparent',
                color: isActive ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <Icon size={13} />
              <span>{pillar.shortLabel}</span>
              <CanonBadgePill badge={badge} compact />
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <aside
      style={{
        width: collapsed ? 56 : 215,
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface, #111623)',
        borderRight: '1px solid var(--border-subtle, #263046)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 150ms ease',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '10px 6px' : '10px 12px',
          borderBottom: '1px solid var(--border-subtle, #263046)',
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #94a3b8)' }}>
            Pilares (10)
          </span>
        )}
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir navegação de pilares' : 'Recolher navegação de pilares'}
          onClick={() => setCollapsed((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border-subtle, #263046)',
            backgroundColor: 'var(--bg-elevated, #171d2e)',
            color: 'var(--text-secondary, #94a3b8)',
            cursor: 'pointer',
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav aria-label="Pilares de construção mundial" style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 6px' : '8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {WORLD_PILLARS.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.id];
          const badge = pillarScores[pillar.id];
          const isActive = activePillar === pillar.id;
          return (
            <button
              key={pillar.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              aria-label={collapsed ? `${pillar.label} (${badge.score}/10)` : undefined}
              title={collapsed ? `${pillar.label} · ${badge.score}/10` : undefined}
              onClick={() => onSelectPillar(pillar.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                gap: 8,
                padding: collapsed ? '9px 4px' : '8px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid transparent',
                borderLeft: isActive ? '3px solid var(--accent-primary, #3b82f6)' : '3px solid transparent',
                backgroundColor: isActive ? 'var(--bg-elevated, #171d2e)' : 'transparent',
                color: isActive ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)',
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                position: 'relative',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                <Icon size={15} style={{ flexShrink: 0, color: isActive ? 'var(--accent-primary, #3b82f6)' : undefined }} />
                {!collapsed && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pillar.label}
                  </span>
                )}
              </span>

              {collapsed ? (
                <span aria-hidden="true" style={{ position: 'absolute', right: 4, bottom: 3, fontSize: 9, fontWeight: 700, lineHeight: 1, color: badge.color }}>
                  {badge.score}
                </span>
              ) : (
                <CanonBadgePill badge={badge} compact />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
