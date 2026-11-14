import { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import type { Faction } from '../types/project';
import { FactionRosterSidebar } from '../components/roster/FactionRosterSidebar';
import { FactionDossierTabs } from '../components/roster/FactionDossierTabs';

export function FactionsStudioView() {
  const { project, upsertFaction } = useProject();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    project.factions[0]?.id ?? ''
  );
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiConcept, setAiConcept] = useState('');

  const filteredFactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return project.factions.filter(
      (f) =>
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.subtype.toLowerCase().includes(q)
    );
  }, [project.factions, search]);

  const selected =
    project.factions.find((f) => f.id === selectedId) ?? filteredFactions[0];

  const handleCreateManual = () => {
    const newFaction: Faction = {
      id: `faction_${Date.now()}`,
      name: 'Nova Facção',
      aliases: [],
      subtype: 'Ordem / Organização',
      motto: '',
      color: '#a855f7',
      status: 'provisional',
      publicAgenda: '',
      secretAgenda: '',
      doctrine: '',
      history: '',
      resourcesAndPower: '',
      internalConflicts: '',
      notes: '',
      ranks: [],
      controlledLocationIds: [],
      tags: ['faccao'],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertFaction(newFaction);
    setSelectedId(newFaction.id);
  };

  const handleCreateWithAiConcept = () => {
    const concept = aiConcept.trim();
    if (!concept) return;
    const worldLabel = project.worlds[0]?.name || 'o cenário principal';
    const newFaction: Faction = {
      id: `faction_${Date.now()}`,
      name: concept.split(' ').slice(0, 4).join(' '),
      aliases: [],
      subtype: 'Organização / Coalizão',
      motto: '',
      color: '#a855f7',
      status: 'provisional',
      publicAgenda: `Atuação estratégica ligada a ${concept} em ${worldLabel}.`,
      secretAgenda: '',
      doctrine: '',
      history: `Originada em torno de: ${concept}.`,
      resourcesAndPower: '',
      internalConflicts: '',
      notes: `Conceito inicial (IA): ${concept}`,
      ranks: [],
      controlledLocationIds: [],
      tags: ['faccao', 'ia'],
      relationships: [],
      epistemicSecrets: [],
    };
    upsertFaction(newFaction);
    setSelectedId(newFaction.id);
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
      <FactionRosterSidebar
        factions={project.factions}
        filteredFactions={filteredFactions}
        selectedId={selected?.id ?? ''}
        onSelectId={setSelectedId}
        search={search}
        onSearchChange={setSearch}
        onCreateManual={handleCreateManual}
        onOpenAiModal={() => setShowAiModal(true)}
      />

      {selected ? (
        <FactionDossierTabs selected={selected} />
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
          <div style={{ fontSize: 14 }}>Nenhuma facção cadastrada neste projeto.</div>
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
            + Criar Primeira Facção
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
              Gerar Facção com IA
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
              Descreva o papel político, econômico ou clandestino da facção para estruturar o dossiê.
            </p>
            <input
              value={aiConcept}
              onChange={(e) => setAiConcept(e.target.value)}
              placeholder="Ex.: Guilda de Cartógrafos que controla os portos noturnos..."
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
                disabled={!aiConcept.trim()}
                onClick={handleCreateWithAiConcept}
                style={{
                  padding: '7px 14px',
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  opacity: aiConcept.trim() ? 1 : 0.55,
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 6px)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: aiConcept.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Criar Rascunho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
