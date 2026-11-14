import { useId, useMemo, useState } from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { DASHBOARD_CARD_STYLE, DASHBOARD_SUBCARD_STYLE } from './dashboardTheme';
import { FloatingChartTooltip } from './FloatingChartTooltip';
import { computeProjectHealthSummary } from './projectHealthData';

export function ProjectHealthCard() {
  const { project, totalWordCount, setActiveView } = useProject();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const tooltipId = useId();

  const summary = useMemo(
    () => computeProjectHealthSummary(project, totalWordCount),
    [project, totalWordCount]
  );

  const activeTip = useMemo(() => {
    if (!hoveredKey) return null;
    if (hoveredKey === 'radar') {
      return {
        xPercent: 80,
        title: `Saúde Geral: ${summary.healthScore}/100`,
        lines: [
          `30% Meta (${summary.wordGoalPercent}%) + 35% Elenco (${summary.castDepth}%) + 35% Mundo/Facções (${summary.worldDepth}%)`,
          'Clique para abrir Radar de Cânone',
        ],
      };
    }
    const dim = summary.dimensions.find((d) => d.key === hoveredKey);
    if (dim) {
      return { xPercent: dim.xPercent, title: dim.tooltipTitle, lines: dim.tooltipLines };
    }
    const foot = summary.footerItems.find((f) => f.key === hoveredKey);
    if (foot) {
      return { xPercent: foot.xPercent, title: foot.tooltipTitle, lines: foot.tooltipLines };
    }
    return null;
  }, [hoveredKey, summary]);

  return (
    <section
      className="ig-card-interactive"
      style={{ ...DASHBOARD_CARD_STYLE, position: 'relative' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setHoveredKey(null);
      }}
    >
      <FloatingChartTooltip
        id={tooltipId}
        visible={activeTip !== null}
        xPercent={activeTip?.xPercent ?? 50}
        minWidth={220}
        maxWidth={270}
      >
        {activeTip && (
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {activeTip.title}
            </div>
            {activeTip.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11,
                  color:
                    i === activeTip.lines.length - 1
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </FloatingChartTooltip>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          <Activity size={15} style={{ color: 'var(--success, #10b981)' }} /> Saúde do Projeto
        </span>
        <button
          type="button"
          className="ig-tile-interactive"
          aria-describedby={hoveredKey === 'radar' ? tooltipId : undefined}
          onMouseEnter={() => setHoveredKey('radar')}
          onMouseLeave={() => setHoveredKey((c) => (c === 'radar' ? null : c))}
          onFocus={() => setHoveredKey('radar')}
          onBlur={() => setHoveredKey((c) => (c === 'radar' ? null : c))}
          onClick={() => setActiveView('canon-radar')}
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--success, #10b981)',
            backgroundColor: 'color-mix(in srgb, var(--success, #10b981) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--success, #10b981) 30%, transparent)',
            padding: '2px 9px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {summary.healthScore}/100 <ArrowUpRight size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
        {summary.dimensions.map((dim) => (
          <button
            key={dim.key}
            type="button"
            className="ig-tile-interactive"
            aria-describedby={hoveredKey === dim.key ? tooltipId : undefined}
            onMouseEnter={() => setHoveredKey(dim.key)}
            onMouseLeave={() => setHoveredKey((c) => (c === dim.key ? null : c))}
            onFocus={() => setHoveredKey(dim.key)}
            onBlur={() => setHoveredKey((c) => (c === dim.key ? null : c))}
            onClick={() => setActiveView(dim.targetView)}
            style={{
              ...DASHBOARD_SUBCARD_STYLE,
              width: '100%',
              padding: '7px 9px',
              textAlign: 'left',
              display: 'block',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{dim.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {dim.valueLabel}
              </span>
            </div>
            <div
              style={{
                height: 5,
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${dim.percent}%`,
                  height: '100%',
                  backgroundColor: dim.barColor,
                  borderRadius: 999,
                  transition: 'width 260ms ease',
                }}
              />
            </div>
          </button>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
          {summary.footerItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="ig-tile-interactive"
              aria-describedby={hoveredKey === item.key ? tooltipId : undefined}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey((c) => (c === item.key ? null : c))}
              onFocus={() => setHoveredKey(item.key)}
              onBlur={() => setHoveredKey((c) => (c === item.key ? null : c))}
              onClick={() => setActiveView(item.targetView)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: '4px 8px',
                color: item.color,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
