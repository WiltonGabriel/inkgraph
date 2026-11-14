import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useViewport } from '../hooks/useViewport';
import { WORLD_PILLARS, scoreWorldMaturity, scoreWorldPillar, type WorldPillarId } from '../domain/canonScoreCalculator';
import { calculateWorldCompleteness, type World } from '../types/project';
import { CompletenessRing } from '../components/ui/CompletenessRing';
import { WorldPillarNav } from '../components/world/WorldPillarNav';
import { CanonBadgePill, WorldScoreChecklistBanner, worldStyles } from '../components/world/WorldScoreChecklistBanner';
import { WorldGeographyPillar, WorldOverviewPillar } from '../components/world/WorldOverviewAndGeoPillars';
import {
  WorldCulturePillar,
  WorldEconomyPillar,
  WorldHistoryPillar,
  WorldPoliticsPillar,
} from '../components/world/WorldCulturePoliticsEconomyPillars';
import { WorldAtlasMapTab } from '../components/world/WorldAtlasMapTab';
import { WorldLocationsTab, WorldTimelineTab } from '../components/world/WorldLocationsAndTimelineTabs';
import { WorldSystemsTab } from '../components/world/WorldSystemsTab';

const SUBPATH_TO_WORLD_TAB: Record<string, WorldPillarId> = {
  'visão geral': 'overview',
  'visao geral': 'overview',
  geral: 'overview',
  overview: 'overview',
  geografia: 'geography',
  geography: 'geography',
  cultura: 'culture',
  culture: 'culture',
  política: 'politics',
  politica: 'politics',
  politics: 'politics',
  economia: 'economy',
  economy: 'economy',
  história: 'history',
  historia: 'history',
  history: 'history',
  locais: 'locations',
  locations: 'locations',
  'atlas & mapas': 'atlas',
  'atlas / mapas': 'atlas',
  atlas: 'atlas',
  mapas: 'atlas',
  'sistemas & leis': 'systems',
  sistemas: 'systems',
  leis: 'systems',
  systems: 'systems',
  'linha do tempo': 'timeline',
  cronologia: 'timeline',
  timeline: 'timeline',
};

const WORLD_TAB_TO_SUBPATH = Object.fromEntries(
  WORLD_PILLARS.map((p) => [p.id, p.subPath])
) as Record<WorldPillarId, string>;

export function WorldbuildingStudioView() {
  const { project, upsertWorld, activeSubPath, setActiveSubPath } = useProject();
  const { width } = useViewport();
  const isCompact = width < 960;

  const [selectedWorldId, setSelectedWorldId] = useState<string>(project.worlds[0]?.id ?? '');
  const [activePillar, setActivePillar] = useState<WorldPillarId>(
    () => SUBPATH_TO_WORLD_TAB[activeSubPath.trim().toLowerCase()] ?? 'overview'
  );

  useEffect(() => {
    const trimmed = activeSubPath.trim().toLowerCase();
    if (!trimmed) {
      setActivePillar('overview');
      return;
    }
    const mapped = SUBPATH_TO_WORLD_TAB[trimmed];
    if (mapped) setActivePillar(mapped);
  }, [activeSubPath]);

  const handlePillarSwitch = (nextPillar: WorldPillarId) => {
    setActivePillar(nextPillar);
    setActiveSubPath(WORLD_TAB_TO_SUBPATH[nextPillar]);
  };

  const world = project.worlds.find((w) => w.id === selectedWorldId) ?? project.worlds[0];

  const handleCreateWorld = () => {
    const newWorld: World = {
      id: `world_${Date.now()}`,
      name: `Novo Mundo ${project.worlds.length + 1}`,
      premise: '',
      description: '',
      geography: '',
      culture: '',
      history: '',
      magicOrTechSummary: '',
      politicsSummary: '',
      economySummary: '',
      notes: '',
      locations: [],
      timeline: [],
      systems: [],
      maps: [],
    };
    upsertWorld(newWorld);
    setSelectedWorldId(newWorld.id);
  };

  if (!world) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text-secondary, #94a3b8)' }}>
        <div>Nenhum mundo cadastrado neste projeto.</div>
        <button type="button" onClick={handleCreateWorld} style={{ ...worldStyles.primaryBtn, backgroundColor: '#10b981', color: '#052e16' }}>
          + Criar Mundo
        </button>
      </div>
    );
  }

  const worldReport = scoreWorldMaturity(world);
  const activePillarMeta = WORLD_PILLARS.find((p) => p.id === activePillar) ?? WORLD_PILLARS[0];
  const activePillarBadge = scoreWorldPillar(world, activePillar);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: isCompact ? '12px 16px' : '14px 24px',
          backgroundColor: 'var(--bg-surface, #111623)',
          borderBottom: '1px solid var(--border-subtle, #263046)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <CompletenessRing percent={calculateWorldCompleteness(world)} size={46} strokeWidth={4} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: isCompact ? 17 : 19, color: 'var(--text-primary, #f1f5f9)' }}>
                Construção Mundial: {world.name}
              </h2>
              <CanonBadgePill badge={worldReport.overallScore} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 2 }}>
              {world.locations.length} {world.locations.length === 1 ? 'local' : 'locais'} · {world.maps?.length ?? 0}{' '}
              {(world.maps?.length ?? 0) === 1 ? 'mapa' : 'mapas'} · {world.systems.length}{' '}
              {world.systems.length === 1 ? 'sistema' : 'sistemas'} · {world.timeline.length}{' '}
              {world.timeline.length === 1 ? 'marco' : 'marcos'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {project.worlds.length > 1 && (
            <select aria-label="Selecionar mundo" value={world.id} onChange={(e) => setSelectedWorldId(e.target.value)} style={{ ...worldStyles.input, width: 'auto', minWidth: 160 }}>
              {project.worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={handleCreateWorld} style={{ ...worldStyles.secondaryBtn, color: '#10b981' }}>
            <Plus size={13} /> Novo Mundo
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: isCompact ? 'column' : 'row', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <WorldPillarNav activePillar={activePillar} onSelectPillar={handlePillarSwitch} pillarScores={worldReport.pillars} />

        <div key={world.id} style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: isCompact ? 16 : 24 }}>
          <WorldScoreChecklistBanner pillarLabel={activePillarMeta.label} badge={activePillarBadge} />

          {activePillar === 'overview' && <WorldOverviewPillar world={world} onUpdateWorld={upsertWorld} />}
          {activePillar === 'geography' && (
            <WorldGeographyPillar
              world={world}
              onUpdateWorld={upsertWorld}
              onOpenAtlas={() => handlePillarSwitch('atlas')}
              onOpenLocations={() => handlePillarSwitch('locations')}
            />
          )}
          {activePillar === 'culture' && (
            <WorldCulturePillar world={world} onUpdateWorld={upsertWorld} onOpenSystems={() => handlePillarSwitch('systems')} />
          )}
          {activePillar === 'politics' && <WorldPoliticsPillar world={world} onUpdateWorld={upsertWorld} />}
          {activePillar === 'economy' && <WorldEconomyPillar world={world} onUpdateWorld={upsertWorld} />}
          {activePillar === 'history' && (
            <WorldHistoryPillar world={world} onUpdateWorld={upsertWorld} onOpenTimeline={() => handlePillarSwitch('timeline')} />
          )}
          {activePillar === 'locations' && (
            <WorldLocationsTab
              world={world}
              factions={project.factions}
              onUpdateWorld={upsertWorld}
              onOpenAtlas={() => handlePillarSwitch('atlas')}
            />
          )}
          {activePillar === 'atlas' && <WorldAtlasMapTab world={world} factions={project.factions} onUpdateWorld={upsertWorld} />}
          {activePillar === 'systems' && <WorldSystemsTab world={world} onUpdateWorld={upsertWorld} />}
          {activePillar === 'timeline' && <WorldTimelineTab world={world} onUpdateWorld={upsertWorld} />}
        </div>
      </div>
    </div>
  );
}
