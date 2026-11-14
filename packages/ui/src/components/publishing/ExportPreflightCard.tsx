import { useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Radar,
  GitBranch,
  ExternalLink,
} from 'lucide-react';
import type { ProjectData } from '../../types/project';
import { computeProjectCanonScoreSummary } from '../../domain/canonScoreCalculator';
import { detectSceneEpistemicAlerts } from '../../domain/memoryCompiler';

interface ExportPreflightCardProps {
  project: ProjectData;
  onOpenCanonRadar: () => void;
  onOpenVersions: () => void;
  onOpenManuscriptScene: (sceneId: string) => void;
}

export function ExportPreflightCard({
  project,
  onOpenCanonRadar,
  onOpenVersions,
  onOpenManuscriptScene,
}: ExportPreflightCardProps) {
  const preflight = useMemo(() => {
    const scoreSummary = computeProjectCanonScoreSummary(project);
    const pendingProposals = project.stagingProposals.filter(
      (p) => p.status === 'pending'
    );
    const incompleteScenes = project.scenes.filter(
      (s) => s.status === 'outline' || s.status === 'draft'
    );
    const epistemicAlerts = project.scenes.flatMap((scene) =>
      detectSceneEpistemicAlerts(project, scene, true)
    );
    const hasBlockers =
      pendingProposals.length > 0 ||
      incompleteScenes.length > 0 ||
      epistemicAlerts.length > 0;
    const isReady = !hasBlockers && scoreSummary.overall.score >= 7;

    return {
      scoreSummary,
      pendingProposals,
      incompleteScenes,
      epistemicAlerts,
      isReady,
    };
  }, [project]);

  const { scoreSummary, pendingProposals, incompleteScenes, epistemicAlerts, isReady } =
    preflight;
  const bannerColor = isReady ? '#10b981' : epistemicAlerts.length > 0 ? '#ef4444' : '#f59e0b';

  const counters = [
    {
      label: 'Propostas em Staging',
      value: pendingProposals.length,
      tone: pendingProposals.length === 0 ? '#10b981' : '#f59e0b',
    },
    {
      label: 'Cenas em Esboço/Rascunho',
      value: incompleteScenes.length,
      tone: incompleteScenes.length === 0 ? '#10b981' : '#f59e0b',
    },
    {
      label: 'Alertas Epistêmicos',
      value: epistemicAlerts.length,
      tone: epistemicAlerts.length === 0 ? '#10b981' : '#ef4444',
    },
    {
      label: 'Score Geral de Cânone',
      value: `${scoreSummary.overall.score}/10`,
      tone: scoreSummary.overall.color,
    },
  ];

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        border: `1px solid ${bannerColor}55`,
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isReady ? (
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          ) : (
            <ShieldAlert size={18} style={{ color: bannerColor, flexShrink: 0 }} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary, #f1f5f9)' }}>
                {isReady ? 'Pronto para Publicação' : 'Atenção Recomendada'}
              </strong>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: `${scoreSummary.overall.color}22`,
                  color: scoreSummary.overall.color,
                  border: `1px solid ${scoreSummary.overall.color}55`,
                }}
              >
                {scoreSummary.overall.score}/10 · {scoreSummary.overall.label}
              </span>
            </div>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11.5,
                color: 'var(--text-secondary, #94a3b8)',
              }}
            >
              {isReady
                ? 'Staging limpo, cenas revisadas e consistência epistêmica verificada antes da compilação.'
                : 'Revise pendências de staging, cenas em rascunho ou alertas epistêmicos antes da versão final.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenCanonRadar}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Radar size={13} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
            Ver no Radar
          </button>
          <button
            type="button"
            onClick={onOpenVersions}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <GitBranch size={13} style={{ color: '#f59e0b' }} />
            Revisar Staging
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 8,
        }}
      >
        {counters.map((item) => (
          <div
            key={item.label}
            style={{
              padding: '8px 11px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
              {item.label}
            </span>
            <strong style={{ fontSize: 14, color: item.tone }}>{item.value}</strong>
          </div>
        ))}
      </div>

      {(incompleteScenes.length > 0 || epistemicAlerts.length > 0) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            paddingTop: 4,
          }}
        >
          {incompleteScenes.slice(0, 4).map((scene) => (
            <button
              key={`inc_${scene.id}`}
              type="button"
              onClick={() => onOpenManuscriptScene(scene.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 999,
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>
                {scene.title} ({scene.status === 'outline' ? 'esboço' : 'rascunho'})
              </span>
              <ExternalLink size={10} />
            </button>
          ))}
          {epistemicAlerts.slice(0, 3).map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => onOpenManuscriptScene(alert.sceneId)}
              title={alert.message}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 999,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Vazamento: {alert.entityName}</span>
              <ExternalLink size={10} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
