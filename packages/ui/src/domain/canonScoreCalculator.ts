import type {
  Character,
  Faction,
  ProjectData,
  RuleSystem,
  StoryObject,
  World,
  WorldLocation,
} from '../types/project';

export type CanonScoreTier = 'critical' | 'partial' | 'good' | 'canon_ready';

export interface CanonScoreBadgeInfo {
  score: number;
  tier: CanonScoreTier;
  color: string;
  label: string;
  filledCount: number;
  totalCount: number;
  missingItems: string[];
}

export type WorldPillarId =
  | 'overview'
  | 'geography'
  | 'culture'
  | 'politics'
  | 'economy'
  | 'history'
  | 'locations'
  | 'atlas'
  | 'systems'
  | 'timeline';

export interface WorldPillarMeta {
  id: WorldPillarId;
  label: string;
  shortLabel: string;
  subPath: string;
}

export const WORLD_PILLARS: WorldPillarMeta[] = [
  { id: 'overview', label: 'Visão Geral', shortLabel: 'Geral', subPath: 'Visão Geral' },
  { id: 'geography', label: 'Geografia', shortLabel: 'Geografia', subPath: 'Geografia' },
  { id: 'culture', label: 'Cultura', shortLabel: 'Cultura', subPath: 'Cultura' },
  { id: 'politics', label: 'Política', shortLabel: 'Política', subPath: 'Política' },
  { id: 'economy', label: 'Economia', shortLabel: 'Economia', subPath: 'Economia' },
  { id: 'history', label: 'História', shortLabel: 'História', subPath: 'História' },
  { id: 'locations', label: 'Locais', shortLabel: 'Locais', subPath: 'Locais' },
  { id: 'atlas', label: 'Atlas / Mapas', shortLabel: 'Atlas', subPath: 'Atlas & Mapas' },
  { id: 'systems', label: 'Sistemas & Leis', shortLabel: 'Sistemas', subPath: 'Sistemas & Leis' },
  { id: 'timeline', label: 'Linha do Tempo', shortLabel: 'Cronologia', subPath: 'Linha do Tempo' },
];

export interface WorldCanonReport {
  worldId: string;
  worldName: string;
  overallScore: CanonScoreBadgeInfo;
  pillars: Record<WorldPillarId, CanonScoreBadgeInfo>;
}

export interface EntityCanonScoreItem {
  id: string;
  name: string;
  kind: 'character' | 'faction' | 'location' | 'system' | 'object';
  status: string;
  badge: CanonScoreBadgeInfo;
}

export interface ProjectCanonScoreSummary {
  overall: CanonScoreBadgeInfo;
  worldReport: WorldCanonReport | null;
  charactersAvg: number;
  factionsAvg: number;
  objectsAvg: number;
  entities: EntityCanonScoreItem[];
}

export interface MaturityCheck {
  ok: boolean;
  missingLabel: string;
}

function hasText(value: string | undefined, minLength = 1): boolean {
  return (value?.trim().length ?? 0) >= minLength;
}

/**
 * Resolves the 1-10 maturity color tier strictly following the canonical visual scale.
 */
export function resolveScoreTierAndColor(score: number): {
  tier: CanonScoreTier;
  color: string;
  label: string;
} {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  if (clamped <= 3) {
    return { tier: 'critical', color: '#ef4444', label: 'Esboço Inicial' };
  }
  if (clamped <= 6) {
    return { tier: 'partial', color: '#f59e0b', label: 'Em Construção' };
  }
  if (clamped <= 8) {
    return { tier: 'good', color: '#3b82f6', label: 'Consistente' };
  }
  return { tier: 'canon_ready', color: '#10b981', label: 'Cânone Maduro' };
}

/**
 * Computes a normalized 1-10 Canon Maturity Score from concrete boolean checks.
 */
export function computeScoreFromChecks(checks: MaturityCheck[]): CanonScoreBadgeInfo {
  const totalCount = Math.max(1, checks.length);
  const filledCount = checks.filter((c) => c.ok).length;
  const missingItems = checks.filter((c) => !c.ok).map((c) => c.missingLabel);
  const rawScore = Math.round(1 + (filledCount / totalCount) * 9);
  const score = Math.max(1, Math.min(10, rawScore));
  const tierInfo = resolveScoreTierAndColor(score);
  return {
    score,
    ...tierInfo,
    filledCount,
    totalCount,
    missingItems,
  };
}

function buildPillarChecks(world: World, pillar: WorldPillarId): MaturityCheck[] {
  const pol = world.politics;
  const eco = world.economy;

  switch (pillar) {
    case 'overview':
      return [
        { ok: hasText(world.name, 2), missingLabel: 'Definir nome oficial do mundo' },
        { ok: hasText(world.premise, 12), missingLabel: 'Escrever premissa central do universo' },
        { ok: hasText(world.description, 20), missingLabel: 'Detalhar visão geral descritiva' },
        { ok: hasText(world.notes, 8), missingLabel: 'Adicionar notas de concepção e tom' },
      ];
    case 'geography':
      return [
        { ok: hasText(world.geography, 20), missingLabel: 'Descrever continentes, climas e biomas' },
        { ok: world.locations.length >= 2, missingLabel: 'Cadastrar ao menos 2 locais geográficos' },
        {
          ok: world.locations.some((l) => Boolean(l.climateOrAtmosphere?.trim())),
          missingLabel: 'Especificar clima/atmosfera dos locais',
        },
        {
          ok: (world.maps ?? []).some(
            (m) => m.category === 'world' || m.category === 'geography' || m.isPrimary
          ),
          missingLabel: 'Vincular mapa principal no Atlas geográfico',
        },
      ];
    case 'culture':
      return [
        { ok: hasText(world.culture, 20), missingLabel: 'Documentar costumes, idiomas e religiões' },
        { ok: hasText(world.culture, 80), missingLabel: 'Aprofundar tabus sociais, culinária ou artes' },
        {
          ok: world.systems.some((s) => Boolean(s.socialTaboos?.trim())),
          missingLabel: 'Registrar tabus culturais nos sistemas do mundo',
        },
      ];
    case 'politics':
      return [
        {
          ok: hasText(world.politicsSummary, 15),
          missingLabel: 'Resumir estrutura política dominante',
        },
        {
          ok: hasText(pol?.governmentForms, 8),
          missingLabel: 'Definir formas de governo e soberania',
        },
        {
          ok: hasText(pol?.legalCodeAndPunishments, 8),
          missingLabel: 'Descrever códigos legais e punições',
        },
        {
          ok: hasText(pol?.successionRules, 8) || hasText(pol?.treatiesAndAlliances, 8),
          missingLabel: 'Documentar regras de sucessão ou tratados/alianças',
        },
        {
          ok: hasText(pol?.instabilityZones, 8),
          missingLabel: 'Identificar focos de conflito e zonas instáveis',
        },
      ];
    case 'economy':
      return [
        {
          ok: hasText(world.economySummary, 15),
          missingLabel: 'Resumir dinâmica econômica do mundo',
        },
        {
          ok: hasText(eco?.currenciesAndExchange, 6),
          missingLabel: 'Definir moedas, câmbio ou lastro comercial',
        },
        {
          ok: hasText(eco?.exportsAndImports, 8),
          missingLabel: 'Listar principais exportações e importações',
        },
        {
          ok: hasText(eco?.tradeRoutes, 8) || hasText(eco?.guildsBanksAndTaxes, 8),
          missingLabel: 'Mapear rotas comerciais, guildas ou impostos',
        },
        {
          ok: hasText(eco?.scarcityAndBlackMarket, 8),
          missingLabel: 'Especificar recursos escassos ou mercado paralelo',
        },
      ];
    case 'history':
      return [
        { ok: hasText(world.history, 25), missingLabel: 'Redigir resumo histórico e eras passadas' },
        { ok: hasText(world.history, 100), missingLabel: 'Detalhar guerras, fundações ou cataclismas' },
        { ok: world.timeline.length >= 2, missingLabel: 'Vincular ao menos 2 marcos na linha do tempo' },
      ];
    case 'locations':
      return [
        { ok: world.locations.length >= 1, missingLabel: 'Criar o primeiro local canônico' },
        { ok: world.locations.length >= 3, missingLabel: 'Expandir catálogo para ao menos 3 locais' },
        {
          ok:
            world.locations.length > 0 &&
            world.locations.every((l) => Boolean(l.description?.trim()) && Boolean(l.strategicValue?.trim())),
          missingLabel: 'Preencher descrição e valor estratégico de todos os locais',
        },
        {
          ok: world.locations.some((l) => l.connectedLocationIds.length > 0),
          missingLabel: 'Conectar rotas entre locais vizinhos',
        },
      ];
    case 'atlas':
      return [
        {
          ok: (world.maps?.length ?? 0) >= 1,
          missingLabel: 'Fazer upload de ao menos 1 imagem/SVG de mapa no Atlas',
        },
        {
          ok: (world.maps ?? []).some((m) => Boolean(m.isPrimary)),
          missingLabel: 'Marcar um mapa como Principal para Geografia',
        },
        {
          ok:
            world.locations.length > 0 &&
            world.locations.some(
              (l) => Boolean(l.mapAssetId) || (l.coordinates.x !== 50 && l.coordinates.y !== 50)
            ),
          missingLabel: 'Posicionar pinos de locais sobre o mapa do Atlas',
        },
        {
          ok:
            world.locations.some((l) => Boolean(l.blueprintAssetId)) ||
            (world.maps?.length ?? 0) >= 2,
          missingLabel: 'Adicionar camada temática extra ou planta de local',
        },
      ];
    case 'systems':
      return [
        { ok: hasText(world.magicOrTechSummary, 15), missingLabel: 'Resumir leis naturais, magia ou tecnologia' },
        { ok: world.systems.length >= 1, missingLabel: 'Cadastrar ao menos 1 Sistema & Lei formal' },
        {
          ok: world.systems.some(
            (s) => s.fundamentalRules.length > 0 && s.hardLimits.length > 0 && hasText(s.costsAndToll, 5)
          ),
          missingLabel: 'Definir regras fundamentais, custos e limites rígidos',
        },
      ];
    case 'timeline':
      return [
        { ok: world.timeline.length >= 1, missingLabel: 'Registrar primeiro evento histórico do mundo' },
        { ok: world.timeline.length >= 3, missingLabel: 'Registrar ao menos 3 eventos cronológicos' },
        {
          ok: world.timeline.some(
            (ev) => Boolean(ev.locationId) || ev.factionIds.length > 0 || ev.characterIds.length > 0
          ),
          missingLabel: 'Vincular eventos a locais, facções ou personagens',
        },
      ];
  }
}

/**
 * Computes the 1-10 maturity score and missing-field checklist for a single worldbuilding pillar.
 */
export function scoreWorldPillar(world: World, pillar: WorldPillarId): CanonScoreBadgeInfo {
  return computeScoreFromChecks(buildPillarChecks(world, pillar));
}

/**
 * Evaluates all 10 worldbuilding pillars and computes the aggregate world 1-10 Canon Score.
 */
export function scoreWorldMaturity(world: World): WorldCanonReport {
  const pillars = {} as Record<WorldPillarId, CanonScoreBadgeInfo>;
  const allChecks: MaturityCheck[] = [];

  for (const meta of WORLD_PILLARS) {
    const checks = buildPillarChecks(world, meta.id);
    pillars[meta.id] = computeScoreFromChecks(checks);
    allChecks.push(...checks);
  }

  return {
    worldId: world.id,
    worldName: world.name,
    overallScore: computeScoreFromChecks(allChecks),
    pillars,
  };
}

/**
 * Evaluates a character dossier on the universal 1-10 Canon Maturity scale.
 */
export function scoreCharacterMaturity(c: Character): CanonScoreBadgeInfo {
  return computeScoreFromChecks([
    { ok: hasText(c.name, 2), missingLabel: 'Nome canônico' },
    { ok: hasText(c.role, 2), missingLabel: 'Papel narrativo / função' },
    { ok: hasText(c.appearance, 10), missingLabel: 'Aparência física / visual' },
    { ok: hasText(c.backstory, 15), missingLabel: 'História pregressa (backstory)' },
    { ok: hasText(c.motivation, 8), missingLabel: 'Motivação central' },
    { ok: hasText(c.flaws, 5) && hasText(c.personalityTraits, 5), missingLabel: 'Traços de personalidade e falhas' },
    { ok: hasText(c.want, 4) || hasText(c.need, 4), missingLabel: 'Desejo (Want) e Necessidade (Need)' },
    { ok: hasText(c.characterArc, 8) || hasText(c.arcAct1, 8), missingLabel: 'Arco dramático planejado' },
    { ok: c.relationships.length > 0, missingLabel: 'Ao menos 1 relacionamento mapeado' },
  ]);
}

/**
 * Evaluates a faction dossier on the universal 1-10 Canon Maturity scale.
 */
export function scoreFactionMaturity(f: Faction): CanonScoreBadgeInfo {
  return computeScoreFromChecks([
    { ok: hasText(f.name, 2), missingLabel: 'Nome da facção' },
    { ok: hasText(f.subtype, 2), missingLabel: 'Subtipo institucional' },
    { ok: hasText(f.publicAgenda, 10), missingLabel: 'Agenda pública declarada' },
    { ok: hasText(f.secretAgenda, 10), missingLabel: 'Agenda oculta / segredos internos' },
    { ok: hasText(f.doctrine, 10), missingLabel: 'Doutrina ou código de conduta' },
    { ok: hasText(f.resourcesAndPower, 8), missingLabel: 'Recursos, força militar ou econômica' },
    { ok: f.ranks.length > 0, missingLabel: 'Hierarquia / patentes internas' },
    { ok: f.relationships.length > 0, missingLabel: 'Relações diplomáticas ou rivalidades' },
  ]);
}

/**
 * Evaluates a world location on the universal 1-10 Canon Maturity scale.
 */
export function scoreLocationMaturity(loc: WorldLocation): CanonScoreBadgeInfo {
  return computeScoreFromChecks([
    { ok: hasText(loc.name, 2), missingLabel: 'Nome do local' },
    { ok: hasText(loc.description, 12), missingLabel: 'Descrição ambiental do local' },
    { ok: hasText(loc.climateOrAtmosphere, 4), missingLabel: 'Clima ou atmosfera sensorial' },
    { ok: hasText(loc.strategicValue, 6), missingLabel: 'Valor estratégico ou narrativo' },
    {
      ok: Boolean(loc.mapAssetId) || (loc.coordinates.x !== 50 || loc.coordinates.y !== 50),
      missingLabel: 'Coordenada posicionada no mapa',
    },
    { ok: loc.connectedLocationIds.length > 0, missingLabel: 'Conexão com outros locais' },
  ]);
}

/**
 * Evaluates a rule system on the universal 1-10 Canon Maturity scale.
 */
export function scoreRuleSystemMaturity(sys: RuleSystem): CanonScoreBadgeInfo {
  return computeScoreFromChecks([
    { ok: hasText(sys.name, 2), missingLabel: 'Nome do sistema / lei' },
    { ok: hasText(sys.coreSource, 6), missingLabel: 'Fonte primária ou fundamento' },
    { ok: sys.fundamentalRules.length > 0, missingLabel: 'Regras fundamentais operacionais' },
    { ok: hasText(sys.costsAndToll, 6), missingLabel: 'Custos, restrições ou ônus de uso' },
    { ok: sys.hardLimits.length > 0, missingLabel: 'Limites rígidos (o que é impossível)' },
    { ok: hasText(sys.socialTaboos, 5), missingLabel: 'Tabus sociais ou sanções legais' },
  ]);
}

/**
 * Evaluates a story object on the universal 1-10 Canon Maturity scale.
 */
export function scoreStoryObjectMaturity(obj: StoryObject): CanonScoreBadgeInfo {
  return computeScoreFromChecks([
    { ok: hasText(obj.name, 2), missingLabel: 'Nome do objeto' },
    { ok: hasText(obj.description, 10), missingLabel: 'Descrição física' },
    { ok: hasText(obj.significance, 6), missingLabel: 'Significância na trama' },
    { ok: hasText(obj.rulesOrCapabilities, 6), missingLabel: 'Capacidades ou regras de uso' },
    {
      ok: Boolean(obj.ownerCharacterId || obj.factionId || obj.locationId),
      missingLabel: 'Custódia atual (personagem, facção ou local)',
    },
    { ok: obj.linkedSceneIds.length > 0, missingLabel: 'Vínculo com cenas do manuscrito' },
  ]);
}

function averageScores(scores: number[]): number {
  if (scores.length === 0) return 1;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.max(1, Math.min(10, Math.round(avg)));
}

/**
 * Aggregates project-wide Canon Maturity Scores across the primary world, characters,
 * factions, locations, rule systems, and story objects.
 */
export function computeProjectCanonScoreSummary(
  project: ProjectData
): ProjectCanonScoreSummary {
  const primaryWorld = project.worlds[0] ?? null;
  const worldReport = primaryWorld ? scoreWorldMaturity(primaryWorld) : null;

  const entities: EntityCanonScoreItem[] = [];
  const charScores: number[] = [];
  const factionScores: number[] = [];
  const objectScores: number[] = [];

  for (const c of project.characters) {
    const badge = scoreCharacterMaturity(c);
    charScores.push(badge.score);
    entities.push({
      id: c.id,
      name: c.name,
      kind: 'character',
      status: c.status,
      badge,
    });
  }

  for (const f of project.factions) {
    const badge = scoreFactionMaturity(f);
    factionScores.push(badge.score);
    entities.push({
      id: f.id,
      name: f.name,
      kind: 'faction',
      status: f.status,
      badge,
    });
  }

  for (const w of project.worlds) {
    for (const loc of w.locations) {
      entities.push({
        id: loc.id,
        name: loc.name,
        kind: 'location',
        status: loc.status ?? 'canon',
        badge: scoreLocationMaturity(loc),
      });
    }
    for (const sys of w.systems) {
      entities.push({
        id: sys.id,
        name: sys.name,
        kind: 'system',
        status: sys.status ?? 'canon',
        badge: scoreRuleSystemMaturity(sys),
      });
    }
  }

  for (const obj of project.objects) {
    const badge = scoreStoryObjectMaturity(obj);
    objectScores.push(badge.score);
    entities.push({
      id: obj.id,
      name: obj.name,
      kind: 'object',
      status: obj.canonStatus ?? 'canon',
      badge,
    });
  }

  const allChecks: MaturityCheck[] = [
    { ok: project.scenes.length > 0, missingLabel: 'Escrever ao menos 1 cena no manuscrito' },
    { ok: project.characters.length > 0, missingLabel: 'Catalogar ao menos 1 personagem' },
    { ok: project.worlds.length > 0, missingLabel: 'Criar configuração de mundo' },
    ...(worldReport
      ? WORLD_PILLARS.map((p) => ({
          ok: worldReport.pillars[p.id].score >= 7,
          missingLabel: `Elevar pilar "${p.label}" para nota >= 7/10`,
        }))
      : []),
    ...(project.characters.length > 0
      ? [
          {
            ok: averageScores(charScores) >= 7,
            missingLabel: 'Elevar maturidade média dos personagens para >= 7/10',
          },
        ]
      : []),
    ...(project.factions.length > 0
      ? [
          {
            ok: averageScores(factionScores) >= 7,
            missingLabel: 'Elevar maturidade média das facções para >= 7/10',
          },
        ]
      : []),
    ...(project.objects.length > 0
      ? [
          {
            ok: averageScores(objectScores) >= 7,
            missingLabel: 'Elevar maturidade média dos objetos para >= 7/10',
          },
        ]
      : []),
    {
      ok: project.stagingProposals.every((p) => p.status !== 'pending'),
      missingLabel: 'Zerar fila de propostas pendentes em Staging',
    },
  ];

  return {
    overall: computeScoreFromChecks(allChecks),
    worldReport,
    charactersAvg: averageScores(charScores),
    factionsAvg: averageScores(factionScores),
    objectsAvg: averageScores(objectScores),
    entities,
  };
}
