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
        backgroundColor: '#0e1118',
        borderRight: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 14, borderBottom: '1px solid #1b202c', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#f3f4f6' }}>
          <User size={15} color="#60a5fa" /> Entrevistado & Arquétipo
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
            Selecionar Personagem
          </label>
          <select
            value={character?.id ?? ''}
            onChange={(e) => onSelectCharacter(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              backgroundColor: '#141926',
              border: '1px solid #262f42',
              borderRadius: 6,
              color: '#f3f4f6',
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
          <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
            Arquétipo Junguiano da Sessão
          </label>
          <select
            value={selectedArchetype}
            onChange={(e) => onSelectArchetype(e.target.value as CharacterArchetype)}
            style={{
              width: '100%',
              padding: '7px 10px',
              backgroundColor: '#141926',
              border: '1px solid #262f42',
              borderRadius: 6,
              color: '#f3f4f6',
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
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
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
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', padding: '0 4px' }}>
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
                borderRadius: 6,
                backgroundColor: active ? '#172033' : '#121621',
                border: active ? '1px solid #2563eb' : '1px solid #1f2533',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <MessageSquare size={11} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  {sess.title}
                </div>
                <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 2 }}>
                  {sess.archetype} · {sess.messages.length} msgs
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteInterview(sess.id);
                }}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 2 }}
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
