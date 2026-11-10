import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import type { CharacterArchetype } from '../types/project';
import { InterviewSidebar } from '../components/interviews/InterviewSidebar';
import { InterviewSessionChat } from '../components/interviews/InterviewSessionChat';

export function CharacterInterviewsView() {
  const { project } = useProject();
  const initialChar = project.characters[0];

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    initialChar?.id ?? ''
  );
  const [selectedArchetype, setSelectedArchetype] = useState<CharacterArchetype>(
    initialChar?.archetype ?? 'hero'
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(
    project.interviews[0]?.id ?? ''
  );

  const handleSelectCharacter = (charId: string) => {
    setSelectedCharacterId(charId);
    const char = project.characters.find((c) => c.id === charId);
    if (char) setSelectedArchetype(char.archetype);
    const firstSession = project.interviews.find((i) => i.characterId === charId);
    setActiveSessionId(firstSession?.id ?? '');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 46px)',
        overflow: 'hidden',
        backgroundColor: '#0a0d14',
      }}
    >
      <InterviewSidebar
        selectedCharacterId={selectedCharacterId}
        onSelectCharacter={handleSelectCharacter}
        selectedArchetype={selectedArchetype}
        onSelectArchetype={setSelectedArchetype}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
      />

      <InterviewSessionChat
        characterId={selectedCharacterId}
        archetype={selectedArchetype}
        sessionId={activeSessionId}
      />
    </div>
  );
}
