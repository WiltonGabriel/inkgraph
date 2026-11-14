import { useMemo, useRef, useState } from 'react';
import { Cpu, Layers, MessageSquare, Sparkles, Trash2, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { compileFourLayerContext } from '../../domain/memoryCompiler';
import { CopilotChatSection } from './CopilotChatSection';
import { CopilotInsightsSection } from './CopilotInsightsSection';
import { CopilotMemoryInspector } from './CopilotMemoryInspector';
import { CopilotModeBar } from './CopilotModeBar';
import {
  buildContextualReply,
  createCopilotStagingProposal,
  type CopilotChatTurn,
} from './CopilotReplyHelper';

type CopilotTab = 'chat' | 'memory';

const QUICK_SUGGESTIONS = [
  'Execute um diagnóstico rápido em meu manuscrito',
  'Como posso fortalecer meu capítulo de abertura?',
  'Explique a lacuna de tensão na minha história',
  'Qual é a coisa mais urgente para consertar?',
];

export function CopilotPanel() {
  const {
    project,
    settings,
    updateSettings,
    activeView,
    setActiveView,
    activeSceneId,
    upsertScene,
    createSnapshot,
    updateProject,
    setShowCopilot,
    notify,
  } = useProject();

  const [activeTab, setActiveTab] = useState<CopilotTab>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Oi! Sou seu Copiloto. Sei em qual tela você está e conheço seus dossiês, facções, cenas e estado epistêmico. Peça um diagnóstico ou inspecione a Memória 4 Camadas.',
    },
  ]);

  const chatTabRef = useRef<HTMLButtonElement | null>(null);
  const memoryTabRef = useRef<HTMLButtonElement | null>(null);

  const memoryPacket = useMemo(
    () => compileFourLayerContext(project, settings, activeView, activeSceneId),
    [project, settings, activeView, activeSceneId]
  );

  const activeScene = useMemo(
    () => project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0],
    [project.scenes, activeSceneId]
  );

  const handleSend = (textToSend?: string) => {
    const raw = (textToSend ?? input).trim();
    if (!raw) return;
    const userTurn: CopilotChatTurn = { id: `u_${Date.now()}`, role: 'user', text: raw };
    const reply = buildContextualReply(raw, project, activeView, activeScene, memoryPacket);
    setMessages((prev) => [...prev, userTurn, reply]);
    if (!textToSend) setInput('');
  };

  const handleSendToStaging = (turnId: string, snippet: string) => {
    if (!activeScene) {
      notify('Crie ou selecione uma cena antes de enviar para Staging.', 'warning');
      return;
    }
    const proposal = createCopilotStagingProposal(activeScene, snippet, memoryPacket);
    updateProject((prev) => ({
      ...prev,
      stagingProposals: [proposal, ...prev.stagingProposals],
    }));
    setMessages((prev) =>
      prev.map((m) => (m.id === turnId ? { ...m, appliedAction: 'staging' } : m))
    );
    notify(`Proposta enviada para Staging ("${activeScene.title}").`, 'success');
  };

  const handleApplyToDraftWithSnapshot = (turnId: string, snippet: string) => {
    if (!activeScene) {
      notify('Crie ou selecione uma cena antes de aplicar ao rascunho.', 'warning');
      return;
    }
    const cleanSnippet = snippet.trim();
    const existingTrimmed = activeScene.content.trimEnd();
    createSnapshot('Antes de inserção do Copiloto');
    upsertScene({
      ...activeScene,
      content: existingTrimmed ? `${existingTrimmed}\n\n${cleanSnippet}` : cleanSnippet,
      lastEditedAt: new Date().toISOString(),
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === turnId ? { ...m, appliedAction: 'draft' } : m))
    );
    notify(`Snapshot criado e trecho aplicado em "${activeScene.title}".`, 'success');
  };

  const isLeft = settings.copilotPosition === 'left';

  return (
    <aside
      aria-label="Copiloto de IA"
      style={{
        width: 356,
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        borderLeft: isLeft ? 'none' : '1px solid var(--border-subtle, var(--border, #263046))',
        borderRight: isLeft ? '1px solid var(--border-subtle, var(--border, #263046))' : 'none',
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
          borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary, #f1f5f9)',
              }}
            >
              Copiloto
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted, #64748b)' }}>
              Você está em:{' '}
              <strong style={{ color: 'var(--text-secondary, #94a3b8)' }}>
                {activeView}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() =>
              updateSettings((s) => ({
                ...s,
                copilotHeuristicsOnly: !s.copilotHeuristicsOnly,
              }))
            }
            title="Alternar Modo Offline (Apenas Heurística)"
            style={{
              backgroundColor: settings.copilotHeuristicsOnly
                ? 'color-mix(in srgb, #10b981 14%, transparent)'
                : 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: settings.copilotHeuristicsOnly
                ? '1px solid color-mix(in srgb, #10b981 36%, transparent)'
                : '1px solid var(--border-subtle, var(--border, #263046))',
              color: settings.copilotHeuristicsOnly
                ? 'color-mix(in srgb, #10b981 74%, var(--text-primary, #f1f5f9))'
                : 'var(--text-secondary, #94a3b8)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '3px 7px',
              fontSize: 10.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Cpu size={11} />
            {settings.copilotHeuristicsOnly ? 'Heurística' : 'Híbrido'}
          </button>

          <button
            type="button"
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
            aria-label="Limpar conversa"
            style={{
              background: 'none',
              color: 'var(--text-muted, #64748b)',
              padding: 4,
            }}
          >
            <Trash2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => setShowCopilot(false)}
            title="Fechar Copiloto"
            aria-label="Fechar Copiloto"
            style={{
              background: 'none',
              color: 'var(--text-muted, #64748b)',
              padding: 4,
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Quick Canon Permission & Memory Compiler Bar */}
      <CopilotModeBar
        canonPermission={settings.canonAiPermission}
        memoryEnabled={settings.enableMemoryCompiler}
        onChangePermission={(next) =>
          updateSettings((s) => ({ ...s, canonAiPermission: next }))
        }
        onToggleMemory={() =>
          updateSettings((s) => ({
            ...s,
            enableMemoryCompiler: !s.enableMemoryCompiler,
          }))
        }
      />

      {/* Tab Switcher: Conversa | Memória 4 Camadas */}
      <div
        role="tablist"
        aria-label="Modos do Copiloto"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
          backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        }}
      >
        <button
          ref={chatTabRef}
          id="copilot-tab-chat"
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          tabIndex={activeTab === 'chat' ? 0 : -1}
          onClick={() => setActiveTab('chat')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault();
              setActiveTab('memory');
              memoryTabRef.current?.focus();
            }
          }}
          style={{
            flex: 1,
            padding: '8px 10px',
            background: 'none',
            fontSize: 11.5,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            color:
              activeTab === 'chat'
                ? 'var(--accent-primary, #3b82f6)'
                : 'var(--text-secondary, #94a3b8)',
            borderBottom:
              activeTab === 'chat'
                ? '2px solid var(--accent-primary, #3b82f6)'
                : '2px solid transparent',
          }}
        >
          <MessageSquare size={12} />
          Conversa
        </button>

        <button
          ref={memoryTabRef}
          id="copilot-tab-memory"
          type="button"
          role="tab"
          aria-selected={activeTab === 'memory'}
          tabIndex={activeTab === 'memory' ? 0 : -1}
          onClick={() => setActiveTab('memory')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault();
              setActiveTab('chat');
              chatTabRef.current?.focus();
            }
          }}
          style={{
            flex: 1,
            padding: '8px 10px',
            background: 'none',
            fontSize: 11.5,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            color:
              activeTab === 'memory'
                ? 'var(--accent-primary, #3b82f6)'
                : 'var(--text-secondary, #94a3b8)',
            borderBottom:
              activeTab === 'memory'
                ? '2px solid var(--accent-primary, #3b82f6)'
                : '2px solid transparent',
          }}
        >
          <Layers size={12} />
          Memória 4 Camadas
          {memoryPacket.epistemicAlerts.length > 0 && (
            <span
              title="Alertas epistêmicos ativos"
              style={{
                padding: '0 5px',
                borderRadius: 999,
                fontSize: 9.5,
                fontWeight: 700,
                backgroundColor: 'color-mix(in srgb, #f59e0b 18%, transparent)',
                color: 'color-mix(in srgb, #d97706 72%, var(--text-primary, #f1f5f9))',
              }}
            >
              {memoryPacket.epistemicAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Conversa Panel */}
      <div
        role="tabpanel"
        aria-labelledby="copilot-tab-chat"
        hidden={activeTab !== 'chat'}
        style={{
          flex: 1,
          minHeight: 0,
          display: activeTab === 'chat' ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <CopilotInsightsSection project={project} onNavigate={setActiveView} />
        <CopilotChatSection
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onSendToStaging={handleSendToStaging}
          onApplyToDraftWithSnapshot={handleApplyToDraftWithSnapshot}
          canonPermission={settings.canonAiPermission}
          activeSceneTitle={activeScene?.title}
          suggestions={QUICK_SUGGESTIONS}
        />
      </div>

      {/* Memória 4 Camadas Panel */}
      <div
        role="tabpanel"
        aria-labelledby="copilot-tab-memory"
        hidden={activeTab !== 'memory'}
        style={{
          flex: 1,
          minHeight: 0,
          display: activeTab === 'memory' ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <CopilotMemoryInspector
          packet={memoryPacket}
          memoryEnabled={settings.enableMemoryCompiler}
          onToggleMemory={(nextEnabled) =>
            updateSettings((s) => ({ ...s, enableMemoryCompiler: nextEnabled }))
          }
        />
      </div>
    </aside>
  );
}
