import { useState } from 'react';
import { Send, BookmarkPlus, Check, User, Bot, Sparkles } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { CharacterArchetype, CharacterInterview } from '../../types/project';
import { checkAiAvailability } from '../../domain/aiAvailability';
import { SubtleAiGatePopover } from '../common/SubtleAiGatePopover';

const ARCHETYPE_QUESTIONS: Record<CharacterArchetype, string[]> = {
  hero: [
    'O que você está disposto a sacrificar quando ninguém estiver olhando?',
    'Qual ferida do passado ainda governa suas decisões sob pressão?',
  ],
  mentor: [
    'Qual verdade perigosa você ocultou do seu protegido para protegê-lo?',
    'Onde você falhou antes de assumir o papel de guia?',
  ],
  villain: [
    'Por que você acredita que sua ordem impiedosa é a única salvação real?',
    'Quem foi a última pessoa que fez você hesitar?',
  ],
  shadow: [
    'Qual desejo inconfessável você compartilha com o seu maior inimigo?',
    'O que acontece se a sua máscara pública cair hoje?',
  ],
  trickster: [
    'Qual regra sagrada desta sociedade é a maior farsa de todas?',
    'O que você esconde atrás do sarcasmo?',
  ],
  shapeshifter: [
    'Para quem vai a sua lealdade quando todos os lados estiverem perdendo?',
    'Qual das suas versões é a verdadeira?',
  ],
  herald: [
    'Que sinal anunciou que o mundo antigo não tinha mais volta?',
    'Por que você trouxe o chamado justamente agora?',
  ],
  ally: [
    'Até que ponto você seguirá ao lado do protagonista antes de cobrar o preço?',
    'O que você vê nele que ele mesmo se recusa a enxergar?',
  ],
  'threshold-guardian': [
    'Qual prova alguém precisa superar para provar que merece passar por você?',
    'Quem ordenou que você guardasse esta fronteira?',
  ],
};

interface InterviewSessionChatProps {
  characterId: string;
  archetype: CharacterArchetype;
  sessionId: string;
}

export function InterviewSessionChat({
  characterId,
  archetype,
  sessionId,
}: InterviewSessionChatProps) {
  const { project, settings, upsertInterview, upsertCharacter } = useProject();
  const [question, setQuestion] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [aiGateOpen, setAiGateOpen] = useState(false);
  const aiStatus = checkAiAvailability(settings);

  const character =
    project.characters.find((c) => c.id === characterId) ?? project.characters[0];

  const session =
    project.interviews.find((i) => i.id === sessionId && i.characterId === character?.id) ??
    project.interviews.find((i) => i.characterId === character?.id);

  if (!character) return null;

  const suggested = ARCHETYPE_QUESTIONS[archetype] ?? ARCHETYPE_QUESTIONS.hero;

  const handleSendQuestion = (textToSend?: string) => {
    const q = (textToSend ?? question).trim();
    if (!q) return;

    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: `m_${Date.now()}_u`, role: 'user' as const, text: q, timestamp: now };
    const secretHint = character.epistemicSecrets[0]?.secret
      ? `Há coisas que mantenho sob sete chaves — como "${character.epistemicSecrets[0].secret}".`
      : 'Cada palavra minha pesa sobre o destino que escolhi.';
    const replyText = `[Voz: ${character.name} · Arquétipo: ${archetype}] Minha motivação sempre foi clara (${character.motivation || character.role}). Diante do que você pergunta ("${q}"), respondo sem rodeios: ${secretHint}`;
    const charMsg = { id: `m_${Date.now()}_c`, role: 'character' as const, text: replyText, timestamp: now };

    const targetSession: CharacterInterview = session
      ? {
          ...session,
          archetype,
          messages: [...session.messages, userMsg, charMsg],
          updatedAt: new Date().toLocaleString('pt-BR'),
        }
      : {
          id: `int_${Date.now()}`,
          characterId: character.id,
          title: `Sabatina (${archetype})`,
          archetype,
          messages: [userMsg, charMsg],
          updatedAt: new Date().toLocaleString('pt-BR'),
        };

    upsertInterview(targetSession);
    setQuestion('');
  };

  const handleCopyToDossier = (msgId: string, text: string) => {
    const nextNotes = character.notes
      ? `${character.notes.trimEnd()}\n\n[Trecho de Entrevista]: ${text}`
      : `[Trecho de Entrevista]: ${text}`;
    upsertCharacter({ ...character, notes: nextNotes });
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 1800);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas, #0b0e16)', overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-subtle, #263046)',
          backgroundColor: 'var(--bg-surface, #111623)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>{character.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
            {character.role} · Arquétipo em foco: <strong style={{ color: 'var(--accent-primary, #3b82f6)' }}>{archetype}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              if (!aiStatus.connected) setAiGateOpen((prev) => !prev);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 8px',
              borderRadius: 999,
              border: aiStatus.connected
                ? '1px solid rgba(16, 185, 129, 0.35)'
                : '1px solid rgba(245, 158, 11, 0.35)',
              backgroundColor: aiStatus.connected
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(245, 158, 11, 0.12)',
              color: aiStatus.connected ? '#10b981' : '#f59e0b',
              fontSize: 10.5,
              fontWeight: 600,
              cursor: aiStatus.connected ? 'default' : 'pointer',
            }}
          >
            <Sparkles size={11} />
            {aiStatus.connected ? 'IA Conectada' : 'Modo Offline (Voz do Dossiê)'}
          </button>

          <SubtleAiGatePopover
            open={aiGateOpen}
            onClose={() => setAiGateOpen(false)}
            align="right"
            title="Modo Offline Ativo"
            message="Sem IA conectada, as respostas simulam a voz do personagem usando diretamente a motivação e os segredos do dossiê local."
          />

          <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>{session?.title ?? 'Nova conversa'}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(session?.messages ?? []).map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '76%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: isUser ? 'var(--accent-primary, #3b82f6)' : 'var(--bg-surface, #111623)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle, #263046)',
                  color: isUser ? '#ffffff' : 'var(--text-primary, #f1f5f9)',
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, fontSize: 11, color: isUser ? 'rgba(255,255,255,0.82)' : 'var(--text-secondary, #94a3b8)', marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    {isUser ? <User size={11} /> : <Bot size={11} />}
                    {isUser ? 'Autor' : character.name}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <div>{msg.text}</div>
                {!isUser && (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleCopyToDossier(msg.id, msg.text)}
                      style={{
                        background: 'var(--bg-elevated, #171d2e)',
                        border: '1px solid var(--border-subtle, #263046)',
                        borderRadius: 5,
                        padding: '3px 8px',
                        color: copiedMsgId === msg.id ? '#10b981' : 'var(--text-secondary, #94a3b8)',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {copiedMsgId === msg.id ? <Check size={11} /> : <BookmarkPlus size={11} />}
                      {copiedMsgId === msg.id ? 'Copiado para o Dossiê' : 'Copiar para Notas do Dossiê'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Archetype Questions */}
      <div style={{ padding: '8px 18px', borderTop: '1px solid var(--border-subtle, #263046)', backgroundColor: 'var(--bg-surface, #111623)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {suggested.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuestion(q)}
            style={{
              padding: '5px 10px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 11.5,
              cursor: 'pointer',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Custom Question Input */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-subtle, #263046)', backgroundColor: 'var(--bg-surface, #111623)', display: 'flex', gap: 8 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
          placeholder={`Faça uma pergunta direta a ${character.name}...`}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: 'var(--bg-elevated, #171d2e)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleSendQuestion()}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--accent-primary, #3b82f6)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Send size={13} /> Perguntar
        </button>
      </div>
    </div>
  );
}
