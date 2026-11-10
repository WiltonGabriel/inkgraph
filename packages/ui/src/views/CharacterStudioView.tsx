import { useState, useMemo } from 'react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { useProject } from '../context/ProjectContext';
import { runAiCompletion } from '../services/aiClient';
import {
  calculateCharacterCompleteness,
  type Character,
} from '../types/project';
import { CharacterRosterSidebar } from '../components/roster/CharacterRosterSidebar';
import { CharacterDossierTabs } from '../components/roster/CharacterDossierTabs';

export function CharacterStudioView() {
  const { project, settings, upsertCharacter } = useProject();
  const aiActive = isAiGenerativeEnabled(settings.aiMode);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'completeDesc' | 'completeAsc'>('completeDesc');
  const [selectedId, setSelectedId] = useState<string>(
    project.characters[0]?.id ?? ''
  );
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiConcept, setAiConcept] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filteredCharacters = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = project.characters.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
    return list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const ca = calculateCharacterCompleteness(a);
      const cb = calculateCharacterCompleteness(b);
      return sortBy === 'completeDesc' ? cb - ca : ca - cb;
    });
  }, [project.characters, search, sortBy]);

  const selected =
    project.characters.find((c) => c.id === selectedId) ?? filteredCharacters[0];

  const handleCreateManual = () => {
    const newChar: Character = {
      id: `char_${Date.now()}`,
      name: 'Novo Personagem',
      aliases: [],
      role: 'Coadjuvante',
      archetype: 'ally',
      status: 'draft',
      avatarColor: '#3b82f6',
      appearance: '',
      backstory: '',
      motivation: '',
      personalityTraits: '',
      flaws: '',
      want: '',
      need: '',
      lieBelieved: '',
      ghost: '',
      arcAct1: '',
      arcAct2: '',
      arcAct3: '',
      characterArc: '',
      notes: '',
      tags: [],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertCharacter(newChar);
    setSelectedId(newChar.id);
  };

  const handleCreateWithAi = async () => {
    const concept = aiConcept.trim();
    if (!concept || aiLoading) return;
    setAiLoading(true);
    setAiError(null);

    const res = await runAiCompletion({
      settings,
      systemPrompt:
        'Return strictly valid JSON with keys: name, role, appearance, backstory, motivation, personalityTraits, flaws, want, need, lieBelieved, ghost. Language matches user prompt.',
      userPrompt: `Project: ${project.title}. Character concept: ${concept}`,
    });

    setAiLoading(false);
    if (!res.ok) {
      setAiError(res.error);
      return;
    }

    let parsed: Partial<Character> = {};
    try {
      const jsonMatch = /\{[\s\S]*\}/.exec(res.text);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : res.text) as Partial<Character>;
    } catch {
      parsed = { backstory: res.text };
    }

    const newChar: Character = {
      id: `char_${Date.now()}`,
      name: parsed.name || concept.split(' ').slice(0, 3).join(' '),
      aliases: [],
      role: parsed.role || 'Coadjuvante',
      archetype: 'shapeshifter',
      status: 'provisional',
      avatarColor: '#a855f7',
      appearance: parsed.appearance || '',
      backstory: parsed.backstory || '',
      motivation: parsed.motivation || '',
      personalityTraits: parsed.personalityTraits || '',
      flaws: parsed.flaws || '',
      want: parsed.want || '',
      need: parsed.need || '',
      lieBelieved: parsed.lieBelieved || '',
      ghost: parsed.ghost || '',
      arcAct1: '',
      arcAct2: '',
      arcAct3: '',
      characterArc: '',
      notes: '',
      tags: ['ia-provisional'],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertCharacter(newChar);
    setSelectedId(newChar.id);
    setAiConcept('');
    setShowAiModal(false);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 46px)', overflow: 'hidden' }}>
      <CharacterRosterSidebar
        characters={project.characters}
        filteredCharacters={filteredCharacters}
        selectedId={selected?.id ?? ''}
        onSelectId={setSelectedId}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onCreateManual={handleCreateManual}
        onOpenAiModal={() => {
          setAiError(null);
          setShowAiModal(true);
        }}
        showAiAction={aiActive}
      />

      {selected ? (
        <CharacterDossierTabs selected={selected} />
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: '#9ca3af',
          }}
        >
          <div style={{ fontSize: 14 }}>Nenhum personagem cadastrado neste projeto.</div>
          <button
            onClick={handleCreateManual}
            style={{
              padding: '8px 14px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Criar Primeiro Personagem
          </button>
        </div>
      )}

      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 140,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 460,
              backgroundColor: '#121621',
              border: '1px solid #283044',
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#f3f4f6' }}>
              Gerar Personagem com IA
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
              Descreva um conceito central e o estúdio criará um perfil completo com backstory, motivação, arco em 3 atos e falhas.
            </p>
            <input
              value={aiConcept}
              onChange={(e) => setAiConcept(e.target.value)}
              placeholder="Ex.: Um contrabandista veterano que conhece as passagens submersas..."
              style={{
                width: '100%',
                backgroundColor: '#141926',
                border: '1px solid #262f42',
                borderRadius: 6,
                padding: '8px 10px',
                color: '#f3f4f6',
                fontSize: 13,
                marginBottom: 14,
              }}
            />
            {aiError && (
              <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 10 }}>
                {aiError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowAiModal(false)}
                style={{
                  padding: '7px 12px',
                  background: 'transparent',
                  border: '1px solid #2c3548',
                  borderRadius: 6,
                  color: '#9ca3af',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleCreateWithAi()}
                disabled={aiLoading || !aiConcept.trim()}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#7c3aed',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: aiLoading ? 'wait' : 'pointer',
                  opacity: aiLoading || !aiConcept.trim() ? 0.6 : 1,
                }}
              >
                {aiLoading ? 'Gerando...' : 'Gerar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
