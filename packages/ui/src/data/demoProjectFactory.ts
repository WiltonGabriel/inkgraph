import type { ProjectData } from '../types/project';
import { DEMO_CHARACTERS, DEMO_FACTIONS } from './seeds/demoCastAndFactions';
import {
  DEMO_WORLDS,
  DEMO_OBJECT_GROUPS,
  DEMO_OBJECTS,
} from './seeds/demoWorldsAndObjects';
import {
  DEMO_SUBPLOTS,
  DEMO_PLOT_CONNECTIONS,
  DEMO_OUTLINE,
  DEMO_SCENES,
  DEMO_BINDER,
  DEMO_INTERVIEWS,
  DEMO_MIND_MAPS,
  DEMO_STAGING_PROPOSALS,
  DEMO_WRITING_LOGS,
} from './seeds/demoScenesAndTools';

export function createDemoProjectData(): ProjectData {
  return {
    id: 'proj_cinzas_vael',
    title: 'As Cinzas de Vael',
    logline:
      'Exilado pela própria ordem militar que ajudou a erguer, um comandante cego precisa expor o pacto de sangue da coroa antes que o segundo cerco consuma a capital.',
    genre: 'Fantasia Política & Mistério',
    wordCountGoal: 80000,
    dailyWordGoal: 1000,
    weeklyWordGoal: 6000,
    deadline: '2026-12-31',
    updatedAt: new Date().toISOString(),
    characters: DEMO_CHARACTERS,
    factions: DEMO_FACTIONS,
    worlds: DEMO_WORLDS,
    objectGroups: DEMO_OBJECT_GROUPS,
    objects: DEMO_OBJECTS,
    subplots: DEMO_SUBPLOTS,
    plotConnections: DEMO_PLOT_CONNECTIONS,
    outline: DEMO_OUTLINE,
    scenes: DEMO_SCENES,
    binder: DEMO_BINDER,
    interviews: DEMO_INTERVIEWS,
    mindMaps: DEMO_MIND_MAPS,
    branches: [
      {
        id: 'branch_main',
        name: 'Principal (Canon)',
        description: 'Linha narrativa principal do manuscrito.',
        createdAt: '2026-11-01',
      },
      {
        id: 'branch_alt_ending',
        name: 'Final Alternativo — Pacto de Cinza',
        description:
          'Variação experimental em que Elias aceita assumir o lugar de Morrigan na Fornalha.',
        createdAt: '2026-11-08',
      },
    ],
    activeBranchId: 'branch_main',
    snapshots: [
      {
        id: 'snap_initial',
        branchId: 'branch_main',
        label: 'Antes da confissão de Elias no Ato II',
        createdAt: '2026-11-08 19:40',
        wordCount: 385,
        scenesBackup: JSON.parse(JSON.stringify(DEMO_SCENES)),
      },
    ],
    stagingProposals: DEMO_STAGING_PROPOSALS,
    writingLogs: DEMO_WRITING_LOGS,
    compileProfile: {
      authorName: 'Autor Local',
      titlePageText: 'AS CINZAS DE VAEL\nRomance em Três Atos',
      dedication:
        'Para aqueles que guardam a memória quando as fornalhas exigem o esquecimento.',
      acknowledgements: 'Manuscrito estruturado e indexado localmente.',
      imprint: 'Edição do Autor · Cofre Local',
    },
  };
}
