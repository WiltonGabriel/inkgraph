import type React from 'react';
import { Users, Globe, Clock } from 'lucide-react';
import type { AppSettings, ProjectData } from '../../types/project';
import {
  canonCardStyle,
  canonCardHeaderStyle,
  canonCardTitleStyle,
} from './canonRadarStyles';

interface CanonReadinessCardProps {
  project: ProjectData;
  settings: AppSettings;
}

export function CanonReadinessCard({ project, settings }: CanonReadinessCardProps) {
  const totalLocations = project.worlds.reduce((sum, w) => sum + w.locations.length, 0);
  const totalSystems = project.worlds.reduce((sum, w) => sum + w.systems.length, 0);

  return (
    <section style={canonCardStyle}>
      <div style={canonCardHeaderStyle}>
        <span style={canonCardTitleStyle}>Cobertura & Prontidão de Cânone do Projeto</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
          Atalho de varredura: <code>{settings.shortcuts.scanCanonNow}</code>
        </span>
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

      <div
        style={{
          marginTop: 4,
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm, 6px)',
          backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
          border: '1px solid var(--border-subtle, var(--border, #263046))',
          fontSize: 12,
          color: 'var(--text-secondary, #94a3b8)',
        }}
      >
        Índice de leitura pronto para varredura contextual de citações, aparições inéditas na prosa e validação epistêmica.
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
