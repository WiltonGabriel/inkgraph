import { useState } from 'react';
import { Check, X, Layers, Play } from 'lucide-react';
import { computeWordDiff } from '@inkgraph/domain';
import { useProject } from '../../context/ProjectContext';
import { runAiCompletion } from '../../services/aiClient';

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

interface StageResult {
  readonly stage: StageName;
  readonly original: string;
  readonly proposed: string;
  readonly status: 'pending' | 'accepted' | 'rejected';
}

interface ProForgePipelinePanelProps {
  onApplyProposal: (proposedText: string) => void;
}

export function ProForgePipelinePanel({ onApplyProposal }: ProForgePipelinePanelProps) {
  const { project, settings, activeSceneId } = useProject();
  const [selectedStage, setSelectedStage] = useState<StageName>(STAGES[0]);
  const [results, setResults] = useState<Partial<Record<StageName, StageResult>>>({});
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

  const handleRunStage = async (stage: StageName) => {
    if (!activeScene) return;
    setRunning(true);
    setErrorMsg(null);
    const original = activeScene.content;

    const res = await runAiCompletion({
      settings,
      systemPrompt: `You are running editorial stage "${stage}". Return an improved revision or structured editorial notes for the scene, preserving author voice and facts.`,
      userPrompt: `Scene: ${activeScene.title}\nSummary: ${activeScene.summary}\nContent:\n${original}`,
    });

    setRunning(false);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setResults((prev) => ({
      ...prev,
      [stage]: {
        stage,
        original,
        proposed: res.text,
        status: 'pending',
      },
    }));
  };

  const currentResult = results[selectedStage];
  const diffSummary = currentResult
    ? computeWordDiff(currentResult.original, currentResult.proposed)
    : null;

  const handleDecision = (stage: StageName, status: 'accepted' | 'rejected') => {
    const entry = results[stage];
    if (!entry) return;
    setResults((prev) => ({ ...prev, [stage]: { ...entry, status } }));
    if (status === 'accepted') {
      onApplyProposal(entry.proposed);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0a0d14', overflow: 'hidden', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#a78bfa" />
          <h2 style={{ margin: 0, fontSize: 17, color: '#f3f4f6' }}>Pipeline Editorial ProForge</h2>
        </div>

        <button
          onClick={() => void handleRunStage(selectedStage)}
          disabled={running || !activeScene}
          style={{
            padding: '7px 14px',
            borderRadius: 6,
            backgroundColor: '#7c3aed',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            opacity: running ? 0.6 : 1,
          }}
        >
          <Play size={13} /> {running ? 'Executando...' : `Executar: ${selectedStage}`}
        </button>
      </div>

      {/* 8 Stages Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, marginBottom: 16 }}>
        {STAGES.map((stage) => {
          const active = selectedStage === stage;
          const hasResult = Boolean(results[stage]);
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: active ? '1px solid #a78bfa' : '1px solid #1f2533',
                backgroundColor: active ? '#1d1836' : '#121621',
                color: active ? '#e9d5ff' : hasResult ? '#34d399' : '#9ca3af',
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

      {errorMsg && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: 12 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!currentResult ? (
          <div style={{ padding: 24, borderRadius: 8, backgroundColor: '#121621', border: '1px solid #222a3a', color: '#9ca3af', fontSize: 13 }}>
            Selecione o estágio acima e clique em <strong>Executar</strong> para enviar a cena ativa ao seu provedor de IA configurado. Nenhuma simulação automática é gerada sem inferência real.
          </div>
        ) : (
          <div style={{ padding: 14, backgroundColor: '#121621', border: '1px solid #222a3a', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>{currentResult.stage}</span>
              {diffSummary && (
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  +{diffSummary.addedWords} / -{diffSummary.removedWords} palavras
                </span>
              )}
            </div>

            {diffSummary && (
              <div style={{ padding: 12, backgroundColor: '#0c0f17', border: '1px solid #1f2637', borderRadius: 6, marginBottom: 12, fontSize: 12.5, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {diffSummary.segments.map((seg, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor:
                        seg.type === 'added'
                          ? 'rgba(16,185,129,0.22)'
                          : seg.type === 'removed'
                            ? 'rgba(239,68,68,0.22)'
                            : 'transparent',
                      color:
                        seg.type === 'added'
                          ? '#6ee7b7'
                          : seg.type === 'removed'
                            ? '#fca5a5'
                            : '#d1d5db',
                      textDecoration: seg.type === 'removed' ? 'line-through' : 'none',
                    }}
                  >
                    {seg.text}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => handleDecision(currentResult.stage, 'accepted')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentResult.status === 'accepted' ? '#059669' : '#10b981',
                  color: '#052e16',
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Check size={12} /> {currentResult.status === 'accepted' ? 'Aceito' : 'Aplicar ao Rascunho'}
              </button>
              <button
                onClick={() => handleDecision(currentResult.stage, 'rejected')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#19202e',
                  color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.35)',
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <X size={12} /> {currentResult.status === 'rejected' ? 'Rejeitado' : 'Descartar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
