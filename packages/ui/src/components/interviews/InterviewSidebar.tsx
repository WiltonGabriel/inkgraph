import { Plus, Trash2, MessageSquare, User } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { CharacterArchetype, CharacterInterview } from '../../types/project';

const ARCHETYPES: { id: CharacterArchetype; label: string }[] = [
  { id: 'hero', label: 'Herói (hero)' },
  { id: 'mentor', label: 'Mentor (mentor)' },
  { id: 'villain', label: 'Vilão (villain)' },
  { id: 'shadow', label: 'Sombra (shadow)' },
  { id: 'trickster', label: 'Trapaceiro (trickster)' },
  { id: 'shapeshifter', label: 'Metamorfo (shapeshifter)' },
  { id: 'herald', label: 'Arauto (herald)' },
  { id: 'ally', label: 'Aliado (ally)' },
  { id: 'threshold-guardian', label: 'Guardião do Limiar (threshold-guardian)' },
];

interface InterviewSidebarProps {
  selectedCharacterId: string;
  onSelectCharacter: (id: string) => void;
  selectedArchetype: CharacterArchetype;
  onSelectArchetype: (arch: CharacterArchetype) => void;
  activeSessionId: string;
  onSelectSession: (id: string) => void;
}

export function InterviewSidebar({
  selectedCharacterId,
  onSelectCharacter,
  selectedArchetype,
  onSelectArchetype,
  activeSessionId,
  onSelectSession,
}: InterviewSidebarProps) {
  const { project, upsertInterview, deleteInterview } = useProject();

  const character =
    project.characters.find((c) => c.id === selectedCharacterId) ?? project.characters[0];

  const charSessions = project.interviews.filter(
    (i) => i.characterId === character?.id
  );

  const handleCreateSession = () => {
    if (!character) return;
    const newSession: CharacterInterview = {
      id: `int_${Date.now()}`,
      characterId: character.id,
      title: `Sabatina (${selectedArchetype}) #${charSessions.length + 1}`,
      archetype: selectedArchetype,
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'character',
          text: `Estou diante de você como ${character.name}. Pergunte o que deseja saber sobre minhas escolhas.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      updatedAt: new Date().toLocaleString('pt-BR'),
    };
    upsertInterview(newSession);
    onSelectSession(newSession.id);
  };

  return (
    <aside
      style={{
        width: 290,
        backgroundColor: 'var(--bg-surface, #111623)',
        borderRight: '1px solid var(--border-subtle, #263046)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 14, borderBottom: '1px solid var(--border-subtle, #263046)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
          <User size={15} style={{ color: 'var(--accent-primary, #3b82f6)' }} /> Entrevistado & Arquétipo
        </div>

        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: 4 }}>
            Selecionar Personagem
          </label>
          <select
            value={character?.id ?? ''}
            onChange={(e) => onSelectCharacter(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 12.5,
            }}
          >
            {project.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: 4 }}>
            Arquétipo Junguiano da Sessão
          </label>
          <select
            value={selectedArchetype}
            onChange={(e) => onSelectArchetype(e.target.value as CharacterArchetype)}
            style={{
              width: '100%',
              padding: '7px 10px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 12,
            }}
          >
            {ARCHETYPES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateSession}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'var(--accent-primary, #3b82f6)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={13} /> Nova Sessão de Entrevista
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', padding: '0 4px' }}>
          Sessões Salvas ({charSessions.length})
        </div>
        {charSessions.map((sess) => {
          const active = sess.id === activeSessionId;
          return (
            <div
              key={sess.id}
              onClick={() => onSelectSession(sess.id)}
              style={{
                padding: '9px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: active ? 'var(--bg-hover, #1f273d)' : 'var(--bg-elevated, #171d2e)',
                border: active ? '1px solid var(--accent-primary, #3b82f6)' : '1px solid var(--border-subtle, #263046)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <MessageSquare size={11} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  {sess.title}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                  {sess.archetype} · {sess.messages.length} msgs
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteInterview(sess.id);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted, #64748b)', cursor: 'pointer', padding: 2 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
