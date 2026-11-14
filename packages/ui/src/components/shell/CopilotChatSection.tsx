import { CheckCircle2, FileDiff, GitCommitHorizontal, Send } from 'lucide-react';
import type { CanonAiPermission } from '../../types/project';

export interface CopilotChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedSnippet?: string;
  appliedAction?: 'staging' | 'draft';
}

export interface CopilotChatSectionProps {
  messages: CopilotChatTurn[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: (textToSend?: string) => void;
  onSendToStaging: (turnId: string, snippet: string) => void;
  onApplyToDraftWithSnapshot: (turnId: string, snippet: string) => void;
  canonPermission: CanonAiPermission;
  activeSceneTitle?: string;
  suggestions: string[];
}

export function CopilotChatSection({
  messages,
  input,
  onInputChange,
  onSend,
  onSendToStaging,
  onApplyToDraftWithSnapshot,
  canonPermission,
  activeSceneTitle,
  suggestions,
}: CopilotChatSectionProps) {
  const hasActiveScene = Boolean(activeSceneTitle);
  const autoPrimary = canonPermission === 'auto';

  return (
    <>
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
              backgroundColor:
                m.role === 'user'
                  ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
                  : 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border:
                m.role === 'user'
                  ? '1px solid color-mix(in srgb, var(--accent-primary, #3b82f6) 42%, transparent)'
                  : '1px solid var(--border-subtle, var(--border, #263046))',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '9px 11px',
              fontSize: 12,
              color: 'var(--text-primary, #f1f5f9)',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent-primary, #3b82f6)',
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
                  backgroundColor: 'var(--bg-canvas, var(--bg-primary, #0b0e16))',
                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                  borderRadius: 'var(--radius-sm, 6px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted, #64748b)',
                    fontWeight: 600,
                  }}
                >
                  {activeSceneTitle
                    ? `Alvo: ${activeSceneTitle}`
                    : 'Nenhuma cena ativa selecionada'}
                </div>

                <div
                  style={{
                    fontSize: 11.5,
                    fontStyle: 'italic',
                    color: 'var(--text-secondary, #94a3b8)',
                  }}
                >
                  {m.suggestedSnippet.trim()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <button
                    type="button"
                    disabled={!hasActiveScene}
                    onClick={() => onSendToStaging(m.id, m.suggestedSnippet!)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      opacity: hasActiveScene ? 1 : 0.55,
                      backgroundColor: autoPrimary
                        ? 'var(--bg-elevated, var(--bg-card, #171d2e))'
                        : 'var(--accent-primary, #3b82f6)',
                      color: autoPrimary ? 'var(--text-primary, #f1f5f9)' : '#ffffff',
                      border: autoPrimary
                        ? '1px solid var(--border-subtle, var(--border, #263046))'
                        : '1px solid var(--accent-primary, #3b82f6)',
                    }}
                  >
                    <FileDiff size={12} />
                    Enviar para Staging
                  </button>

                  <button
                    type="button"
                    disabled={!hasActiveScene}
                    onClick={() => onApplyToDraftWithSnapshot(m.id, m.suggestedSnippet!)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      opacity: hasActiveScene ? 1 : 0.55,
                      backgroundColor: autoPrimary
                        ? '#059669'
                        : 'color-mix(in srgb, #10b981 12%, transparent)',
                      color: autoPrimary
                        ? '#ffffff'
                        : 'color-mix(in srgb, #10b981 74%, var(--text-primary, #f1f5f9))',
                      border: autoPrimary
                        ? '1px solid #059669'
                        : '1px solid color-mix(in srgb, #10b981 36%, transparent)',
                    }}
                  >
                    <GitCommitHorizontal size={12} />
                    Aplicar ao Rascunho (com Snapshot)
                  </button>
                </div>

                {m.appliedAction && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color:
                        'color-mix(in srgb, #10b981 74%, var(--text-primary, #f1f5f9))',
                    }}
                  >
                    <CheckCircle2 size={11} />
                    {m.appliedAction === 'staging'
                      ? 'Proposta registrada em Staging'
                      : 'Aplicado ao rascunho após snapshot automático'}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Quick Suggestions */}
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--text-muted, #64748b)',
              fontWeight: 600,
            }}
          >
            Sugestões rápidas:
          </div>
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onSend(sug)}
              style={{
                textAlign: 'left',
                padding: '6px 9px',
                backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
                border: '1px solid var(--border-subtle, var(--border, #263046))',
                borderRadius: 'var(--radius-sm, 6px)',
                color: 'var(--accent-primary, #3b82f6)',
                fontSize: 11,
                fontWeight: 500,
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
          borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
          backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
          display: 'flex',
          gap: 6,
        }}
      >
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend();
          }}
          aria-label="Pergunta para o Copiloto"
          placeholder="Pergunte qualquer coisa sobre sua história..."
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '8px 10px',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: 12,
          }}
        />
        <button
          type="button"
          onClick={() => onSend()}
          title="Enviar"
          aria-label="Enviar mensagem"
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--accent-primary, #3b82f6)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm, 6px)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </>
  );
}
