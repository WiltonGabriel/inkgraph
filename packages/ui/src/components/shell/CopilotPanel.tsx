import { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { useProject } from '../../context/ProjectContext';
import { runAiCompletion } from '../../services/aiClient';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
  type ViewId,
} from '../../types/project';

interface CopilotChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedSnippet?: string;
}

export function CopilotPanel() {
  const {
    project,
    settings,
    updateSettings,
    activeView,
    setActiveView,
    activeSceneId,
    upsertScene,
    setShowCopilot,
  } = useProject();

  const [input, setInput] = useState('');
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [appliedBanner, setAppliedBanner] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<CopilotChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Assistente contextual pronto. Os alertas acima são determinísticos; perguntas no chat consultam o provedor de IA configurado (ou apenas métricas locais quando em modo estrito offline).',
    },
  ]);

  // Live Heuristic Insights (works 100% offline without external calls)
  const insights = useMemo(() => {
    const list: {
      id: string;
      title: string;
      description: string;
      targetView: ViewId;
      severity: 'warn' | 'info';
    }[] = [];

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

    // Check tension drops between consecutive scenes
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
  }, [project]);

  const buildDeterministicTelemetryReply = (): CopilotChatTurn => {
    const avgTension =
      project.scenes.length > 0
        ? Math.round(
            project.scenes.reduce((a, b) => a + b.tension, 0) / project.scenes.length
          )
        : 0;
    const secretsCount = project.characters.reduce((acc, c) => acc + c.epistemicSecrets.length, 0);
    const pendingStaging = project.stagingProposals.filter((p) => p.status === 'pending').length;

    return {
      id: `turn_${Date.now()}`,
      role: 'assistant',
      text: `Telemetria determinística (${project.title}):\n• ${project.scenes.length} cenas (tensão média: ${avgTension}%)\n• ${project.characters.length} personagens, ${project.factions.length} facções, ${secretsCount} segredos epistêmicos\n• ${pendingStaging} proposta(s) em staging\n• ${insights.length} alerta(s) estruturais abertos acima.`,
    };
  };

  const handleSend = async (textToSend?: string) => {
    const raw = (textToSend ?? input).trim();
    if (!raw || sending) return;
    const userTurn: CopilotChatTurn = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: raw,
    };
    setMessages((prev) => [...prev, userTurn]);
    if (!textToSend) setInput('');

    if (
      !isAiGenerativeEnabled(settings.aiMode) ||
      settings.copilotHeuristicsOnly ||
      settings.aiProvider === 'mcp'
    ) {
      setMessages((prev) => [...prev, buildDeterministicTelemetryReply()]);
      return;
    }

    const activeScene =
      project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

    setSending(true);
    const res = await runAiCompletion({
      settings,
      systemPrompt: `You are the InkGraph studio copilot for "${project.title}". Current view: ${activeView}. Never fabricate unseen lore.`,
      userPrompt: `Active scene: ${activeScene?.title ?? 'None'}\nExcerpt:\n${(activeScene?.content ?? '').slice(-1500)}\n\nQuestion: ${raw}`,
    });
    setSending(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `turn_${Date.now()}`,
        role: 'assistant',
        text: res.ok ? res.text : `Falha ao consultar provedor: ${res.error}`,
      },
    ]);
  };

  const handleApplyToChapter = (snippet: string) => {
    const activeScene =
      project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
    if (!activeScene) return;
    upsertScene({
      ...activeScene,
      content: `${activeScene.content.trimEnd()}${snippet}`,
      lastEditedAt: new Date().toISOString(),
    });
    setAppliedBanner(`Alteração aplicada em "${activeScene.title}".`);
    setTimeout(() => setAppliedBanner(''), 3500);
  };

  const suggestions = [
    'Execute um diagnóstico rápido em meu manuscrito',
    'Como posso fortalecer meu capítulo de abertura?',
    'Explique a lacuna de tensão na minha história',
    'Qual é a coisa mais urgente para consertar?',
  ];

  return (
    <aside
      aria-label="Copiloto de IA"
      style={{
        width: 340,
        backgroundColor: '#0e1118',
        borderLeft: settings.copilotPosition === 'left' ? 'none' : '1px solid #1f2533',
        borderRight: settings.copilotPosition === 'left' ? '1px solid #1f2533' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #1b202c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} color="#60a5fa" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>
              Copiloto
            </div>
            <div style={{ fontSize: 10.5, color: '#6b7280' }}>
              Você está em: <strong style={{ color: '#9ca3af' }}>{activeView}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() =>
              updateSettings((s) => ({
                ...s,
                copilotHeuristicsOnly: !s.copilotHeuristicsOnly,
              }))
            }
            title="Alternar Modo Offline (Apenas Heurística)"
            style={{
              background: settings.copilotHeuristicsOnly ? 'rgba(16,185,129,0.15)' : '#161b26',
              border: '1px solid #262e40',
              color: settings.copilotHeuristicsOnly ? '#34d399' : '#9ca3af',
              borderRadius: 5,
              padding: '3px 7px',
              fontSize: 10.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Cpu size={11} />
            {settings.copilotHeuristicsOnly ? 'Heurística' : 'Híbrido'}
          </button>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'welcome_reset',
                  role: 'assistant',
                  text: 'Conversa limpa. Como posso ajudar nesta tela?',
                },
              ])
            }
            title="Limpar conversa"
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Trash2 size={13} />
          </button>

          <button
            onClick={() => setShowCopilot(false)}
            title="Fechar Copiloto"
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Collapsible Heuristic Insights Section */}
      <div
        style={{
          borderBottom: '1px solid #1b202c',
          backgroundColor: '#121621',
        }}
      >
        <button
          onClick={() => setInsightsExpanded((v) => !v)}
          style={{
            width: '100%',
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            color: '#d1d5db',
            fontSize: 11.5,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span>Informações & Heurísticas ({insights.length})</span>
          <span style={{ fontSize: 10.5, color: '#60a5fa' }}>
            {insightsExpanded ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {insightsExpanded && (
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
              <div style={{ fontSize: 11.5, color: '#10b981', padding: '4px 2px' }}>
                Nenhum problema narrativo detectado no momento.
              </div>
            ) : (
              insights.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#171c29',
                    border: '1px solid #242b3d',
                    borderRadius: 6,
                    fontSize: 11.5,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: item.severity === 'warn' ? '#fbbf24' : '#60a5fa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <AlertTriangle size={11} />
                      {item.title}
                    </span>
                    <button
                      onClick={() => setActiveView(item.targetView)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#93c5fd',
                        fontSize: 10.5,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      Abrir <ArrowUpRight size={10} />
                    </button>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 11, lineHeight: 1.4 }}>
                    {item.description}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {appliedBanner && (
        <div
          style={{
            padding: '7px 12px',
            backgroundColor: 'rgba(16,185,129,0.15)',
            borderBottom: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399',
            fontSize: 11.5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle2 size={13} /> {appliedBanner}
        </div>
      )}

      {/* Conversation History */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
              backgroundColor: m.role === 'user' ? '#1e3a8a' : '#151a26',
              border: m.role === 'user' ? '1px solid #2563eb' : '1px solid #232a3b',
              borderRadius: 8,
              padding: '9px 11px',
              fontSize: 12,
              color: '#e5e7eb',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: m.role === 'user' ? '#93c5fd' : '#60a5fa',
                marginBottom: 4,
              }}
            >
              {m.role === 'user' ? 'Você' : 'Copiloto'}
            </div>
            <div>{m.text}</div>
            {m.suggestedSnippet && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: '#0c0f17',
                  border: '1px solid #262f45',
                  borderRadius: 6,
                }}
              >
                <div style={{ fontSize: 11.5, fontStyle: 'italic', color: '#d1d5db' }}>
                  {m.suggestedSnippet.trim()}
                </div>
                <button
                  onClick={() => handleApplyToChapter(m.suggestedSnippet!)}
                  style={{
                    marginTop: 8,
                    padding: '5px 10px',
                    backgroundColor: '#10b981',
                    color: '#06281e',
                    border: 'none',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Aplicar ao capítulo
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Quick Suggestions */}
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600 }}>
            Sugestões rápidas:
          </div>
          {suggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => handleSend(sug)}
              style={{
                textAlign: 'left',
                padding: '6px 9px',
                backgroundColor: '#141824',
                border: '1px solid #22293a',
                borderRadius: 6,
                color: '#93c5fd',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input Footer */}
      <div
        style={{
          padding: 10,
          borderTop: '1px solid #1b202c',
          display: 'flex',
          gap: 6,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Pergunte qualquer coisa sobre sua história..."
          style={{
            flex: 1,
            backgroundColor: '#141824',
            border: '1px solid #252c3d',
            borderRadius: 6,
            padding: '8px 10px',
            color: '#f3f4f6',
            fontSize: 12,
          }}
        />
        <button
          onClick={() => handleSend()}
          title="Enviar"
          style={{
            padding: '8px 12px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </aside>
  );
}
