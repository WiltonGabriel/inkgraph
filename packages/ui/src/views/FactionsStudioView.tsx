import { useState, useMemo } from 'react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { useProject } from '../context/ProjectContext';
import type { Faction } from '../types/project';
import { FactionRosterSidebar } from '../components/roster/FactionRosterSidebar';
import { FactionDossierTabs } from '../components/roster/FactionDossierTabs';

export function FactionsStudioView() {
  const { project, settings, upsertFaction } = useProject();
  const aiActive = isAiGenerativeEnabled(settings.aiMode);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    project.factions[0]?.id ?? ''
  );

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

  const handleCreateFaction = (withAi = false) => {
    const newFaction: Faction = {
      id: `faction_${Date.now()}`,
      name: 'Nova Facção',
      aliases: [],
      subtype: 'Ordem / Organização',
      motto: '',
      color: '#a855f7',
      status: withAi ? 'provisional' : 'draft',
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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 46px)', overflow: 'hidden' }}>
      <FactionRosterSidebar
        factions={project.factions}
        filteredFactions={filteredFactions}
        selectedId={selected?.id ?? ''}
        onSelectId={setSelectedId}
        search={search}
        onSearchChange={setSearch}
        onCreateFaction={handleCreateFaction}
        showAiAction={aiActive}
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
            color: '#9ca3af',
          }}
        >
          <div style={{ fontSize: 14 }}>Nenhuma facção cadastrada neste projeto.</div>
          <button
            onClick={() => handleCreateFaction(false)}
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
            + Criar Primeira Facção
          </button>
        </div>
      )}
    </div>
  );
}
