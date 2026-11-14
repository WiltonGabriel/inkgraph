import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
  type ProjectData,
  type ViewId,
} from '../../types/project';

export interface CopilotInsightItem {
  id: string;
  title: string;
  description: string;
  targetView: ViewId;
  severity: 'warn' | 'info';
}

export function buildCopilotInsights(project: ProjectData): CopilotInsightItem[] {
  const list: CopilotInsightItem[] = [];

  for (const c of project.characters) {
    const pct = calculateCharacterCompleteness(c);
    if (pct < 75) {
      list.push({
        id: `ins_char_${c.id}`,
        title: 'Personagem precisa de desenvolvimento',
        description: `${c.name} aparece no elenco, mas seu perfil está ${pct}% completo.`,
        targetView: 'characters',
        severity: 'warn',
      });
    }
  }

  for (const f of project.factions) {
    const pct = calculateFactionCompleteness(f);
    if (pct < 75) {
      list.push({
        id: `ins_fac_${f.id}`,
        title: 'Facção subespecificada',
        description: `${f.name} está ${pct}% completa — detalhe recursos ou conflitos internos.`,
        targetView: 'factions',
        severity: 'info',
      });
    }
  }

  for (const w of project.worlds) {
    const pct = calculateWorldCompleteness(w);
    if (pct < 75) {
      list.push({
        id: `ins_w_${w.id}`,
        title: 'Entrada mundial subespecificada',
        description: `${w.name} está ${pct}% completo.`,
        targetView: 'worlds',
        severity: 'info',
      });
    }
  }

  for (let i = 1; i < project.scenes.length; i++) {
    const prev = project.scenes[i - 1];
    const curr = project.scenes[i];
    if (prev.tension - curr.tension >= 20) {
      list.push({
        id: `ins_tension_${curr.id}`,
        title: 'Queda de tensão detectada',
        description: `De "${prev.title}" (${prev.tension}%) para "${curr.title}" (${curr.tension}%) há queda brusca sem batida de recuperação.`,
        targetView: 'plotboard',
        severity: 'warn',
      });
    }
  }

  const pendingStaging = project.stagingProposals.filter((p) => p.status === 'pending').length;
  if (pendingStaging > 0) {
    list.push({
      id: 'ins_staging',
      title: `${pendingStaging} proposta(s) em Staging`,
      description: 'Existem rascunhos provisórios aguardando canonização ou rejeição.',
      targetView: 'versions',
      severity: 'info',
    });
  }

  return list;
}

export interface CopilotInsightsSectionProps {
  project: ProjectData;
  onNavigate: (view: ViewId) => void;
}

export function CopilotInsightsSection({ project, onNavigate }: CopilotInsightsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const insights = useMemo(() => buildCopilotInsights(project), [project]);

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          padding: '8px 14px',
          background: 'none',
          color: 'var(--text-primary, #f1f5f9)',
          fontSize: 11.5,
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Informações &amp; Heurísticas ({insights.length})
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--accent-primary, #3b82f6)' }}>
          {expanded ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            maxHeight: 165,
            overflowY: 'auto',
            padding: '0 12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {insights.length === 0 ? (
            <div
              style={{
                fontSize: 11.5,
                color: 'color-mix(in srgb, #10b981 74%, var(--text-primary, #f1f5f9))',
                padding: '4px 2px',
              }}
            >
              Nenhum problema narrativo detectado no momento.
            </div>
          ) : (
            insights.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                  borderRadius: 'var(--radius-sm, 6px)',
                  fontSize: 11.5,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 3,
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        item.severity === 'warn'
                          ? 'color-mix(in srgb, #d97706 72%, var(--text-primary, #f1f5f9))'
                          : 'var(--accent-primary, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <AlertTriangle size={11} />
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.targetView)}
                    style={{
                      background: 'none',
                      color: 'var(--accent-primary, #3b82f6)',
                      fontSize: 10.5,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      flexShrink: 0,
                    }}
                  >
                    Abrir <ArrowUpRight size={10} />
                  </button>
                </div>
                <div
                  style={{
                    color: 'var(--text-secondary, #94a3b8)',
                    fontSize: 11,
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
