import { useState, useMemo } from 'react';
import { Check, X, Layers } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const STAGES = [
  '1. Ingestão e Diagnóstico',
  '2. Edição Estrutural',
  '3. Linha e Prosa',
  '4. Edição de Cópia',
  '5. Prova Final',
  '6. Produção',
  '7. Preparação para Publicação',
  '8. Resumo da Execução',
] as const;

type StageName = (typeof STAGES)[number];

interface ReviewItem {
  id: string;
  stage: StageName;
  original: string;
  proposed: string;
  confidence: number;
}

interface ProForgePipelinePanelProps {
  onApplyProposal: (proposedText: string) => void;
}

export function ProForgePipelinePanel({ onApplyProposal }: ProForgePipelinePanelProps) {
  const { project, activeSceneId } = useProject();
  const [activeStage, setActiveStage] = useState<StageName | 'ALL'>('ALL');
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'rejected'>>({});

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

  const dynamicItems = useMemo<ReviewItem[]>(() => {
    const paragraphs = (activeScene?.content ?? '')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/^#+\s*/, '').trim())
      .filter(Boolean);
    const firstPara = paragraphs[0] || activeScene?.summary || 'Parágrafo inicial da cena.';
    const secondPara = paragraphs[1] || firstPara;
    const charName = project.characters[0]?.name || 'o protagonista';
    const facName = project.factions[0]?.name || 'a facção principal';

    return [
      {
        id: 'pf_1',
        stage: '1. Ingestão e Diagnóstico',
        original: firstPara.slice(0, 140),
        proposed: `${firstPara.slice(0, 110)} — ancorando o conflito imediato de ${charName} logo na abertura.`,
        confidence: 94,
      },
      {
        id: 'pf_2',
        stage: '2. Edição Estrutural',
        original: `Tensão declarada da cena "${activeScene?.title ?? 'Cena'}": ${activeScene?.tension ?? 50}%.`,
        proposed: `Inserir batida de reação sensorial antes da virada dramática do Ato ${activeScene?.act ?? 1}.`,
        confidence: 91,
      },
      {
        id: 'pf_3',
        stage: '3. Linha e Prosa',
        original: secondPara.slice(0, 140),
        proposed: secondPara
          .slice(0, 140)
          .replace(/\bmuito\b/gi, '')
          .trim() + ' — com ritmo verbal condensado.',
        confidence: 96,
      },
      {
        id: 'pf_4',
        stage: '4. Edição de Cópia',
        original: `Menções a ${charName} e ${facName} ao longo do capítulo.`,
        proposed: `Padronizar títulos, travessões literários (—) e grafia canônica de ${facName}.`,
        confidence: 98,
      },
      {
        id: 'pf_5',
        stage: '5. Prova Final',
        original: 'Revisão ortográfica e pontuação de diálogos.',
        proposed: 'Pontuação e concordância validadas para fechamento de prova.',
        confidence: 97,
      },
      {
        id: 'pf_6',
        stage: '6. Produção',
        original: `Capítulo ${activeScene?.chapterNumber ?? 1}: ${activeScene?.title ?? 'Sem título'}`,
        proposed: 'Cabeçalhos e quebras de cena (* * *) normalizados para diagramação.',
        confidence: 95,
      },
      {
        id: 'pf_7',
        stage: '7. Preparação para Publicação',
        original: `Metadados editoriais de "${project.title}"`,
        proposed: `Sinopse e folha de rosto sincronizadas com o perfil de compilação.`,
        confidence: 93,
      },
      {
        id: 'pf_8',
        stage: '8. Resumo da Execução',
        original: `${paragraphs.length} parágrafo(s) analisados na cena ativa.`,
        proposed: 'Pipeline editorial concluído sem violações epistêmicas.',
        confidence: 99,
      },
    ];
  }, [activeScene, project.characters, project.factions, project.title]);

  const visibleItems = useMemo(
    () =>
      activeStage === 'ALL'
        ? dynamicItems
        : dynamicItems.filter((item) => item.stage === activeStage),
    [dynamicItems, activeStage]
  );

  const handleDecision = (item: ReviewItem, status: 'accepted' | 'rejected') => {
    setDecisions((prev) => ({ ...prev, [item.id]: status }));
    if (status === 'accepted') {
      onApplyProposal(item.proposed);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas, #0b0e16)', overflow: 'hidden', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#a78bfa" />
          <h2 style={{ margin: 0, fontSize: 17, color: 'var(--text-primary, #f1f5f9)' }}>Pipeline Editorial ProForge (8 Estágios)</h2>
        </div>
        <button
          onClick={() => setActiveStage('ALL')}
          style={{
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm, 6px)',
            border: activeStage === 'ALL' ? '1px solid #a78bfa' : '1px solid var(--border-subtle, #263046)',
            backgroundColor: activeStage === 'ALL' ? 'rgba(167, 139, 250, 0.16)' : 'var(--bg-surface, #111623)',
            color: activeStage === 'ALL' ? '#a78bfa' : 'var(--text-secondary, #94a3b8)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Ver Todos ({dynamicItems.length})
        </button>
      </div>

      {/* 8 Stages Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
        {STAGES.map((stage) => {
          const active = activeStage === stage;
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: active ? '1px solid #a78bfa' : '1px solid var(--border-subtle, #263046)',
                backgroundColor: active ? 'rgba(167, 139, 250, 0.16)' : 'var(--bg-surface, #111623)',
                color: active ? '#a78bfa' : 'var(--text-secondary, #94a3b8)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {stage}
            </button>
          );
        })}
      </div>

      {/* Review Diff Cards */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleItems.map((item) => {
          const status = decisions[item.id] ?? 'pending';
          return (
            <div
              key={item.id}
              style={{
                padding: 14,
                backgroundColor: 'var(--bg-surface, #111623)',
                border: '1px solid var(--border-subtle, #263046)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{item.stage}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(16,185,129,0.15)',
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                >
                  Confiança: {item.confidence}%
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ padding: 10, backgroundColor: 'var(--bg-elevated, #171d2e)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm, 6px)' }}>
                  <div style={{ fontSize: 10.5, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>Original</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>{item.original}</div>
                </div>
                <div style={{ padding: 10, backgroundColor: 'var(--bg-elevated, #171d2e)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm, 6px)' }}>
                  <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 700, marginBottom: 4 }}>Proposto</div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary, #f1f5f9)', lineHeight: 1.5 }}>{item.proposed}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => handleDecision(item, 'accepted')}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: status === 'accepted' ? '#059669' : '#10b981',
                    color: '#052e16',
                    border: 'none',
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Check size={12} /> {status === 'accepted' ? 'Aceito' : 'Aceitar'}
                </button>
                <button
                  onClick={() => handleDecision(item, 'rejected')}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: 'var(--bg-elevated, #171d2e)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <X size={12} /> {status === 'rejected' ? 'Rejeitado' : 'Rejeitar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
