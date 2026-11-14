import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
  type ProjectData,
  type ViewId,
} from '../../types/project';
import { calculateFleschReadability } from '../../domain/wordCounter';

export interface HealthDimension {
  key: string;
  label: string;
  valueLabel: string;
  percent: number;
  barColor: string;
  targetView: ViewId;
  tooltipTitle: string;
  tooltipLines: string[];
  xPercent: number;
}

export interface HealthFooterItem {
  key: string;
  label: string;
  color: string;
  targetView: ViewId;
  tooltipTitle: string;
  tooltipLines: string[];
  xPercent: number;
}

export interface ProjectHealthSummary {
  wordGoalPercent: number;
  castDepth: number;
  worldDepth: number;
  healthScore: number;
  dimensions: HealthDimension[];
  footerItems: HealthFooterItem[];
}

export function computeProjectHealthSummary(
  project: ProjectData,
  totalWordCount: number
): ProjectHealthSummary {
  const wordGoalPercent = Math.min(
    100,
    Math.round((totalWordCount / Math.max(1, project.wordCountGoal)) * 100)
  );

  const charScores = project.characters.map(calculateCharacterCompleteness);
  const castDepth =
    charScores.length > 0
      ? Math.round(charScores.reduce((a, b) => a + b, 0) / charScores.length)
      : 0;
  const completeChars = charScores.filter((s) => s >= 70).length;

  const worldScores = project.worlds.map(calculateWorldCompleteness);
  const worldOnlyDepth =
    worldScores.length > 0
      ? Math.round(worldScores.reduce((a, b) => a + b, 0) / worldScores.length)
      : 0;

  const factionScores = project.factions.map(calculateFactionCompleteness);
  const factionDepth =
    factionScores.length > 0
      ? Math.round(factionScores.reduce((a, b) => a + b, 0) / factionScores.length)
      : 0;

  const combinedWorldScores = [...worldScores, ...factionScores];
  const worldDepth =
    combinedWorldScores.length > 0
      ? Math.round(
          combinedWorldScores.reduce((a, b) => a + b, 0) /
            combinedWorldScores.length
        )
      : 0;

  const fullProse = project.scenes.map((s) => s.content).join('\n\n');
  const readabilityScore = calculateFleschReadability(fullProse);
  const pendingStaging = project.stagingProposals.filter(
    (p) => p.status === 'pending'
  ).length;
  const snapshotCount = project.snapshots.length;
  const locationCount = project.worlds.reduce((s, w) => s + w.locations.length, 0);
  const systemCount = project.worlds.reduce((s, w) => s + w.systems.length, 0);

  const healthScore = Math.round(
    wordGoalPercent * 0.3 + castDepth * 0.35 + worldDepth * 0.35
  );

  const dimensions: HealthDimension[] = [
    {
      key: 'characters',
      label: `Profundidade do elenco (${project.characters.length})`,
      valueLabel: `${castDepth}%`,
      percent: castDepth,
      barColor: 'var(--accent-primary)',
      targetView: 'characters',
      tooltipTitle: 'Elenco & Personagens',
      tooltipLines: [
        `${completeChars} de ${project.characters.length} dossiês com ≥70% preenchidos`,
        'Clique para abrir Personagens',
      ],
      xPercent: 45,
    },
    {
      key: 'worlds',
      label: `Mundos & Locais (${locationCount})`,
      valueLabel: `${worldOnlyDepth}%`,
      percent: worldOnlyDepth,
      barColor: 'var(--success, #10b981)',
      targetView: 'worlds',
      tooltipTitle: 'Construção Mundial',
      tooltipLines: [
        `${project.worlds.length} mundo(s) · ${locationCount} locais · ${systemCount} sistemas`,
        'Clique para abrir Construção Mundial',
      ],
      xPercent: 45,
    },
    {
      key: 'factions',
      label: `Facções & Ordens (${project.factions.length})`,
      valueLabel: `${factionDepth}%`,
      percent: factionDepth,
      barColor: '#8b5cf6',
      targetView: 'factions',
      tooltipTitle: 'Facções & Hierarquias',
      tooltipLines: [
        `${project.factions.length} facção(ões) cadastradas · Média ${factionDepth}%`,
        'Clique para abrir Facções',
      ],
      xPercent: 45,
    },
  ];

  const footerItems: HealthFooterItem[] = [
    {
      key: 'consistency',
      label: `Legibilidade: ${readabilityScore}/100`,
      color: 'var(--text-primary)',
      targetView: 'consistency',
      tooltipTitle: 'Consistência & Legibilidade',
      tooltipLines: [
        readabilityScore >= 70
          ? 'Ritmo de leitura fluido e acessível'
          : 'Prosa densa — revise períodos longos',
        'Clique para abrir Consistência',
      ],
      xPercent: 25,
    },
    {
      key: 'versions',
      label: `Staging: ${pendingStaging} · Snap: ${snapshotCount}`,
      color: pendingStaging > 0 ? '#d97706' : 'var(--success, #10b981)',
      targetView: 'versions',
      tooltipTitle: 'Versões & Staging',
      tooltipLines: [
        `${pendingStaging} proposta(s) aguardando revisão`,
        `${snapshotCount} snapshot(s) salvos · Clique para abrir`,
      ],
      xPercent: 78,
    },
  ];

  return {
    wordGoalPercent,
    castDepth,
    worldDepth,
    healthScore,
    dimensions,
    footerItems,
  };
}
