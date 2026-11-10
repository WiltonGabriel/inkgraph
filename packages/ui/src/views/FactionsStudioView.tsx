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
    const newFaction: Faction = {
      id: `faction_${Date.now()}`,
      name: withAi ? 'Círculo dos Artífices Cinzentos' : 'Nova Facção',
      aliases: withAi ? ['A Guilda das Válvulas'] : [],
      subtype: withAi ? 'Guilda Tecnocrática & Sindicato' : 'Ordem / Organização',
      motto: withAi ? 'Nenhuma engrenagem gira sem tributo.' : '',
      color: '#a855f7',
      status: 'provisional',
      publicAgenda: withAi
        ? 'Manutenção da infraestrutura térmica dos anéis médios.'
        : '',
      secretAgenda: withAi
        ? 'Acumular reservas clandestinas de piro-cristal para chantagear o Conselho.'
        : '',
      doctrine: withAi
        ? 'O conhecimento técnico deve permanecer restrito aos iniciados.'
        : '',
      history: withAi
        ? 'Formada pelos engenheiros sobreviventes da Segunda Reforma.'
        : '',
      resourcesAndPower: withAi
        ? 'Controle das oficinas de fundição e mapas das tubulações primárias.'
        : '',
      internalConflicts: withAi
        ? 'Disputa entre os mestres conservadores e os jovens sabotadores.'
        : '',
      notes: '',
      ranks: withAi
        ? [
            {
              id: `rk_${Date.now()}`,
              title: 'Grão-Artífice',
              authorityLevel: 10,
              holderIds: [],
              responsibilities:
                'Controle do cofre de diagramas e negociação com a Coroa.',
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

      {selected ? <FactionDossierTabs selected={selected} /> : null}
    </div>
  );
}
