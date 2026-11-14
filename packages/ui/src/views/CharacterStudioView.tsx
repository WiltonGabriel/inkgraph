import { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  type Character,
} from '../types/project';
import { CharacterRosterSidebar } from '../components/roster/CharacterRosterSidebar';
import { CharacterDossierTabs } from '../components/roster/CharacterDossierTabs';

export function CharacterStudioView() {
  const { project, upsertCharacter } = useProject();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'completeDesc' | 'completeAsc'>('completeDesc');
  const [selectedId, setSelectedId] = useState<string>(
    project.characters[0]?.id ?? ''
  );
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiConcept, setAiConcept] = useState('');

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

  const handleCreateWithAi = () => {
    const concept = aiConcept.trim() || 'um estrategista marcado pelo passado';
    const newChar: Character = {
      id: `char_${Date.now()}`,
      name: concept.split(' ').slice(0, 3).join(' '),
      aliases: ['O Silencioso'],
      role: 'Personagem Gerado',
      archetype: 'shapeshifter',
      status: 'provisional',
      avatarColor: '#a855f7',
      appearance: `Presença marcante que reflete sua origem ligada a: ${concept}.`,
      backstory: `Moldado por eventos formativos severos ligados a ${concept}, carrega dívidas antigas com as facções locais.`,
      motivation: `Um desejo central conectado a ${concept} guia todas as suas escolhas.`,
      personalityTraits: 'Engenhoso, reservado, determinado sob pressão.',
      flaws: 'Desconfiança profunda que complica alianças duradouras.',
      want: `Conquistar autonomia e resolver a pendência de ${concept}.`,
      need: 'Aprender a confiar nos aliados antes do colapso final.',
      lieBelieved: 'Acredita que qualquer vínculo pessoal é uma vulnerabilidade explorável.',
      ghost: 'Um juramento quebrado durante a crise anterior.',
      arcAct1: 'Atua nas sombras defendendo apenas seus próprios interesses.',
      arcAct2: 'Forçado a escolher um lado quando o conflito atinge seus protegidos.',
      arcAct3: 'Assume o risco final para salvar o grupo.',
      characterArc: `Começa fechado em si mesmo e, ao longo da trama, é transformado por ${concept}.`,
      notes: '',
      tags: ['gerado', 'elenco'],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertCharacter(newChar);
    setSelectedId(newChar.id);
    setAiConcept('');
    setShowAiModal(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 46px)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-canvas, #0b0e16)',
      }}
    >
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
        onOpenAiModal={() => setShowAiModal(true)}
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
            color: 'var(--text-secondary, #94a3b8)',
          }}
        >
          <div style={{ fontSize: 14 }}>Nenhum personagem cadastrado neste projeto.</div>
          <button
            type="button"
            onClick={handleCreateManual}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--accent-primary, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm, 6px)',
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
            backgroundColor: 'rgba(0,0,0,0.68)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 460,
              backgroundColor: 'var(--bg-surface, #111623)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-primary, #f1f5f9)' }}>
              Gerar Personagem com IA
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
              Descreva um conceito central e o estúdio criará um perfil completo com backstory, motivação, arco em 3 atos e falhas.
            </p>
            <input
              value={aiConcept}
              onChange={(e) => setAiConcept(e.target.value)}
              placeholder="Ex.: Um contrabandista veterano que conhece as passagens submersas..."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-elevated, #171d2e)',
                border: '1px solid var(--border-subtle, #263046)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: '8px 10px',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: 13,
                marginBottom: 14,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                style={{
                  padding: '7px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle, #263046)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateWithAi}
                style={{
                  padding: '7px 14px',
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 6px)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Gerar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
