import { useState } from 'react';
import { Check, X, Layers } from 'lucide-react';

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

interface ReviewItem {
  id: string;
  stage: (typeof STAGES)[number];
  original: string;
  proposed: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const INITIAL_ITEMS: ReviewItem[] = [
  {
    id: 'pf_1',
    stage: '1. Ingestão e Diagnóstico',
    original: 'A cena inicia com exposição direta sobre a história antiga.',
    proposed: 'Ancorar a abertura no conflito imediato do POV antes de introduzir o contexto histórico.',
    confidence: 94,
    status: 'pending',
  },
  {
    id: 'pf_2',
    stage: '2. Edição Estrutural',
    original: 'Transição abrupta entre o diálogo diplomático e a emboscada.',
    proposed: 'Inserir batida de tensão sensorial indicando movimentação nas galerias superiores.',
    confidence: 91,
    status: 'pending',
  },
  {
    id: 'pf_3',
    stage: '3. Linha e Prosa',
    original: 'O vento frio soprava fortemente contra os muros antigos.',
    proposed: 'A geada mordia o basalto fendido das muralhas.',
    confidence: 96,
    status: 'pending',
  },
  {
    id: 'pf_4',
    stage: '4. Edição de Cópia',
    original: 'Padronização de títulos honoríficos e termos de facção.',
    proposed: 'Unificar grafia conforme glossário canônico do projeto.',
    confidence: 98,
    status: 'pending',
  },
];

interface ProForgePipelinePanelProps {
  onApplyProposal: (proposedText: string) => void;
}

export function ProForgePipelinePanel({ onApplyProposal }: ProForgePipelinePanelProps) {
  const [activeStage, setActiveStage] = useState<(typeof STAGES)[number]>(STAGES[0]);
  const [items, setItems] = useState<ReviewItem[]>(INITIAL_ITEMS);

  const handleDecision = (id: string, status: 'accepted' | 'rejected') => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    if (status === 'accepted' && target) {
      onApplyProposal(target.proposed);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0a0d14', overflow: 'hidden', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Layers size={18} color="#a78bfa" />
        <h2 style={{ margin: 0, fontSize: 17, color: '#f3f4f6' }}>Pipeline Editorial ProForge (8 Estágios)</h2>
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
                borderRadius: 6,
                border: active ? '1px solid #a78bfa' : '1px solid #1f2533',
                backgroundColor: active ? '#1d1836' : '#121621',
                color: active ? '#e9d5ff' : '#9ca3af',
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
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 14,
              backgroundColor: '#121621',
              border: '1px solid #222a3a',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>{item.stage}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  color: '#34d399',
                  fontWeight: 600,
                }}
              >
                Confiança: {item.confidence}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ padding: 10, backgroundColor: '#0c0f17', border: '1px solid #2b1d24', borderRadius: 6 }}>
                <div style={{ fontSize: 10.5, color: '#f87171', fontWeight: 700, marginBottom: 4 }}>Original</div>
                <div style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>{item.original}</div>
              </div>
              <div style={{ padding: 10, backgroundColor: '#0c0f17', border: '1px solid #1b3229', borderRadius: 6 }}>
                <div style={{ fontSize: 10.5, color: '#34d399', fontWeight: 700, marginBottom: 4 }}>Proposto</div>
                <div style={{ fontSize: 12, color: '#f3f4f6', lineHeight: 1.5 }}>{item.proposed}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => handleDecision(item.id, 'accepted')}
                style={{
                  padding: '5px 12px',
                  backgroundColor: item.status === 'accepted' ? '#059669' : '#10b981',
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
                <Check size={12} /> Aceitar
              </button>
              <button
                onClick={() => handleDecision(item.id, 'rejected')}
                style={{
                  padding: '5px 12px',
                  backgroundColor: '#19202e',
                  color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.35)',
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <X size={12} /> Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
