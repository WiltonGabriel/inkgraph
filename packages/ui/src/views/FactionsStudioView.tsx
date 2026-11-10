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
    const worldLabel = project.worlds[0]?.name || 'o território';
    const newFaction: Faction = {
      id: `faction_${Date.now()}`,
      name: withAi ? `Coalizão de ${project.title}` : 'Nova Facção',
      aliases: withAi ? ['O Conselho Interno'] : [],
      subtype: withAi ? 'Coalizão Institucional' : 'Ordem / Organização',
      motto: withAi ? 'Ordem através da vigilância mútua.' : '',
      color: '#a855f7',
      status: 'provisional',
      publicAgenda: withAi
        ? `Manter a estabilidade política e logística em ${worldLabel}.`
        : '',
      secretAgenda: withAi
        ? 'Expandir influência estratégica sobre as rotas e arquivos centrais.'
        : '',
      doctrine: withAi
        ? 'A preservação da estrutura coletiva precede interesses individuais.'
        : '',
      history: withAi
        ? `Fundada durante o período de transição de ${worldLabel}.`
        : '',
      resourcesAndPower: withAi
        ? 'Rede de informantes, controle de entrepostos e reservas financeiras.'
        : '',
      internalConflicts: withAi
        ? 'Divergência entre a ala tradicionalista e os reformistas.'
        : '',
      notes: '',
      ranks: withAi
        ? [
            {
              id: `rk_${Date.now()}`,
              title: 'Regente Geral',
              authorityLevel: 10,
              holderIds: [],
              responsibilities:
                'Coordenação estratégica e representação diplomática.',
            },
          ]
        : [],
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
