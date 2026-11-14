import { useState } from 'react';
import { SearchCheck, ExternalLink, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  applyAutoCatalogFinding,
  createStagingProposalFromFinding,
  type CanonFindingCategory,
  type CanonRadarFinding,
  type CanonSuggestedEntityKind,
} from '../../domain/canonRadarEngine';
import type { CanonAiPermission } from '../../types/project';
import { canonCardStyle, canonCardHeaderStyle, canonCardTitleStyle } from './canonRadarStyles';

type FindingFilterTab = 'all' | 'uncataloged' | 'missing_scene_link' | 'epistemic_leak';

const CATEGORY_META: Record<CanonFindingCategory, { label: string; color: string }> = {
  uncataloged_entity: { label: 'Entidade Inédita', color: '#3b82f6' },
  uncataloged_location: { label: 'Local Inédito', color: '#10b981' },
  uncataloged_object: { label: 'Objeto Inédito', color: '#a855f7' },
  missing_scene_link: { label: 'Vínculo de Cena', color: '#f59e0b' },
  epistemic_leak: { label: 'Vazamento Epistêmico', color: '#ef4444' },
};

const KIND_LABELS: Record<CanonSuggestedEntityKind, string> = {
  character: 'Personagem',
  faction: 'Facção',
  location: 'Local',
  object: 'Objeto',
  system: 'Sistema',
};

interface CanonFindingsListCardProps {
  findings: CanonRadarFinding[];
  permissionMode: CanonAiPermission;
  onRescan: () => void;
}

export function CanonFindingsListCard({
  findings,
  permissionMode,
  onRescan,
}: CanonFindingsListCardProps) {
  const { project, updateProject, setActiveSceneId, setActiveView, notify } = useProject();
  const [activeFilter, setActiveFilter] = useState<FindingFilterTab>('all');

  const counts = {
    all: findings.length,
    uncataloged: findings.filter((f) => f.category.startsWith('uncataloged_')).length,
    missing_scene_link: findings.filter((f) => f.category === 'missing_scene_link').length,
    epistemic_leak: findings.filter((f) => f.category === 'epistemic_leak').length,
  };

  const visibleFindings = findings.filter((f) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'uncataloged') return f.category.startsWith('uncataloged_');
    return f.category === activeFilter;
  });

  const tabs: { id: FindingFilterTab; label: string }[] = [
    { id: 'all', label: `Todos (${counts.all})` },
    { id: 'uncataloged', label: `Novas Entidades/Locais/Objetos (${counts.uncataloged})` },
    { id: 'missing_scene_link', label: `Vínculos de Cena (${counts.missing_scene_link})` },
    { id: 'epistemic_leak', label: `Vazamentos Epistêmicos (${counts.epistemic_leak})` },
  ];

  const handleSendToStaging = (finding: CanonRadarFinding) => {
    const proposal = createStagingProposalFromFinding(finding);
    updateProject((prev) => ({
      ...prev,
      stagingProposals: [proposal, ...prev.stagingProposals],
    }));
    onRescan();
    notify(`Proposta "${finding.term}" enviada para Staging.`, 'success');
  };

  const handleAutoCatalog = (finding: CanonRadarFinding) => {
    const { updatedProject, summary } = applyAutoCatalogFinding(project, finding);
    updateProject(() => updatedProject);
    onRescan();
    notify(summary, 'success');
  };

  return (
    <section style={canonCardStyle}>
      <div style={{ ...canonCardHeaderStyle, flexWrap: 'wrap' }}>
        <span style={canonCardTitleStyle}>
          <SearchCheck size={15} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          Achados da Varredura ({findings.length})
        </span>
        {permissionMode === 'observer' && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
            Modo Observador ativo · alterações automáticas bloqueadas
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tabs.map((tab) => {
          const selected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '5px 10px',
                borderRadius: 999,
                fontSize: 11.5,
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

      {visibleFindings.length === 0 ? (
        <div
          style={{
            padding: 18,
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={15} style={{ color: '#10b981' }} />
          <span>Nenhum achado detectado para este filtro na varredura atual.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibleFindings.map((finding) => {
            const cat = CATEGORY_META[finding.category];
            const staged = finding.alreadyStaged;
            const canAutoCatalog =
              permissionMode !== 'observer' &&
              (permissionMode === 'auto' ||
                finding.category === 'missing_scene_link' ||
                finding.category.startsWith('uncataloged_')) &&
              finding.category !== 'epistemic_leak';

            return (
              <div
                key={finding.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13.5, color: 'var(--text-primary, #f1f5f9)' }}>
                      {finding.term}
                    </strong>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 999,
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      {cat.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                      {KIND_LABELS[finding.suggestedKind]} · {Math.round(finding.confidence * 100)}% confiança
                    </span>
                    {staged && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 999,
                          backgroundColor: 'rgba(245, 158, 11, 0.16)',
                          color: '#f59e0b',
                        }}
                      >
                        Em Staging
                      </span>
                    )}
                  </div>

                  {finding.sceneId && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSceneId(finding.sceneId!);
                        setActiveView('manuscript');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 9px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
                        border: '1px solid var(--border-subtle, var(--border, #263046))',
                        color: 'var(--text-primary, #f1f5f9)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>{finding.sceneTitle ?? 'Cena'}</span>
                      <ExternalLink size={11} />
                      <span>Ir para Cena</span>
                    </button>
                  )}
                </div>

                {finding.excerpt && (
                  <blockquote
                    style={{
                      margin: 0,
                      padding: '6px 10px',
                      borderLeft: `3px solid ${cat.color}`,
                      backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
                      borderRadius: '0 6px 6px 0',
                      fontSize: 11.5,
                      color: 'var(--text-secondary, #94a3b8)',
                      fontStyle: 'italic',
                    }}
                  >
                    {finding.excerpt}
                  </blockquote>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                    {finding.rationale}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {!staged && (
                      <button
                        type="button"
                        onClick={() => handleSendToStaging(finding)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          backgroundColor:
                            permissionMode === 'staging'
                              ? 'var(--accent-primary, #3b82f6)'
                              : 'var(--bg-surface, var(--bg-secondary, #111623))',
                          border:
                            permissionMode === 'staging'
                              ? 'none'
                              : '1px solid var(--border-subtle, var(--border, #263046))',
                          color: permissionMode === 'staging' ? '#ffffff' : 'var(--text-primary, #f1f5f9)',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Send size={11} />
                        Enviar p/ Staging
                      </button>
                    )}

                    {canAutoCatalog && (
                      <button
                        type="button"
                        onClick={() => handleAutoCatalog(finding)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          backgroundColor:
                            permissionMode === 'auto'
                              ? '#10b981'
                              : 'rgba(16, 185, 129, 0.14)',
                          border:
                            permissionMode === 'auto'
                              ? 'none'
                              : '1px solid rgba(16, 185, 129, 0.4)',
                          color: permissionMode === 'auto' ? '#ffffff' : '#10b981',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={11} />
                        Auto-Catalogar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
