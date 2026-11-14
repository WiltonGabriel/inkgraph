import type React from 'react';
import { Users, Globe, Clock, Award } from 'lucide-react';
import type { AppSettings, ProjectData } from '../../types/project';
import {
  resolveScoreTierAndColor,
  type ProjectCanonScoreSummary,
} from '../../domain/canonScoreCalculator';
import {
  canonCardStyle,
  canonCardHeaderStyle,
  canonCardTitleStyle,
} from './canonRadarStyles';

interface CanonReadinessCardProps {
  project: ProjectData;
  settings: AppSettings;
  scoreSummary: ProjectCanonScoreSummary;
}

export function CanonReadinessCard({
  project,
  settings,
  scoreSummary,
}: CanonReadinessCardProps) {
  const totalLocations = project.worlds.reduce((sum, w) => sum + w.locations.length, 0);
  const totalSystems = project.worlds.reduce((sum, w) => sum + w.systems.length, 0);

  const { overall, worldReport, charactersAvg, factionsAvg, objectsAvg } = scoreSummary;
  const worldAvg = worldReport?.overallScore.score ?? 1;

  const ringSize = 58;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall.score / 10) * circumference;

  const categoryAverages = [
    { label: 'Mundo', score: worldAvg },
    { label: 'Personagens', score: charactersAvg },
    { label: 'Facções', score: factionsAvg },
    { label: 'Objetos', score: objectsAvg },
  ];

  return (
    <section style={canonCardStyle}>
      <div style={canonCardHeaderStyle}>
        <span style={canonCardTitleStyle}>
          <Award size={15} style={{ color: overall.color }} />
          Cobertura & Score Geral de Cânone (1–10)
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
          Atalho de varredura: <code>{settings.shortcuts.scanCanonNow}</code>
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          padding: '12px 14px',
          borderRadius: 'var(--radius-md, 8px)',
          backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
          border: `1px solid ${overall.color}55`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              position: 'relative',
              width: ringSize,
              height: ringSize,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="transparent"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="transparent"
                stroke={overall.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                fontSize: 13.5,
                fontWeight: 800,
                color: overall.color,
              }}
            >
              {overall.score}/10
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                Score Geral de Cânone
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: `${overall.color}22`,
                  color: overall.color,
                  border: `1px solid ${overall.color}55`,
                }}
              >
                {overall.label}
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
              {overall.filledCount}/{overall.totalCount} critérios globais atendidos
              {overall.missingItems.length > 0
                ? ` · Próximo passo: ${overall.missingItems[0]}`
                : ' · Universo pronto para publicação'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {categoryAverages.map((cat) => {
            const tier = resolveScoreTierAndColor(cat.score);
            return (
              <div
                key={cat.label}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 78,
                }}
              >
                <span style={{ fontSize: 10.5, color: 'var(--text-secondary, #94a3b8)' }}>
                  {cat.label}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: tier.color }}>
                  {cat.score}/10
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        <div style={scopeTileStyle}>
          <div style={scopeTitleStyle}>
            <Users size={14} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
            <span>Entidades & Elenco</span>
            <span style={scopePillStyle(settings.canonScopeEntities)}>
              {settings.canonScopeEntities ? 'Monitorado' : 'Pausado'}
            </span>
          </div>
          <div style={scopeMetricStyle}>
            {project.characters.length}{' '}
            {project.characters.length === 1 ? 'personagem' : 'personagens'} ·{' '}
            {project.factions.length}{' '}
            {project.factions.length === 1 ? 'facção' : 'facções'} ·{' '}
            {project.objects.length}{' '}
            {project.objects.length === 1 ? 'objeto' : 'objetos'}
          </div>
        </div>

        <div style={scopeTileStyle}>
          <div style={scopeTitleStyle}>
            <Globe size={14} style={{ color: '#10b981' }} />
            <span>Mundo & Pilares</span>
            <span style={scopePillStyle(settings.canonScopeWorld)}>
              {settings.canonScopeWorld ? 'Monitorado' : 'Pausado'}
            </span>
          </div>
          <div style={scopeMetricStyle}>
            {project.worlds.length}{' '}
            {project.worlds.length === 1 ? 'mundo' : 'mundos'} · {totalLocations}{' '}
            {totalLocations === 1 ? 'local' : 'locais'} · {totalSystems}{' '}
            {totalSystems === 1 ? 'sistema' : 'sistemas'}
          </div>
        </div>

        <div style={scopeTileStyle}>
          <div style={scopeTitleStyle}>
            <Clock size={14} style={{ color: '#f59e0b' }} />
            <span>Grafo & Cronologia</span>
            <span style={scopePillStyle(settings.canonScopeGraphTimeline)}>
              {settings.canonScopeGraphTimeline ? 'Monitorado' : 'Pausado'}
            </span>
          </div>
          <div style={scopeMetricStyle}>
            {project.scenes.length}{' '}
            {project.scenes.length === 1 ? 'cena' : 'cenas'} ·{' '}
            {project.plotConnections.length}{' '}
            {project.plotConnections.length === 1 ? 'conexão' : 'conexões'}
          </div>
        </div>
      </div>
    </section>
  );
}

const scopeTileStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 'var(--radius-md, 8px)',
  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
  border: '1px solid var(--border-subtle, var(--border, #263046))',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const scopeTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12.5,
  fontWeight: 700,
};

const scopeMetricStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary, #94a3b8)',
};

const scopePillStyle = (enabled: boolean): React.CSSProperties => ({
  marginLeft: 'auto',
  fontSize: 10,
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: 999,
  backgroundColor: enabled ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-hover, #1f273d)',
  color: enabled ? '#10b981' : 'var(--text-muted, #64748b)',
});
