import type {
  AppSettings,
  CanonAiPermission,
  CanonStatus,
  EpistemicSecret,
  ProjectData,
  Scene,
  ViewId,
} from '../types/project';

export type MemoryLayerId =
  | 'immediate'
  | 'epistemic'
  | 'world_canon'
  | 'rolling_summary';

export interface CompiledMemoryItem {
  id: string;
  title: string;
  summary: string;
  status?: CanonStatus | string;
}

export interface CompiledMemoryLayer {
  id: MemoryLayerId;
  label: string;
  estimatedTokens: number;
  items: CompiledMemoryItem[];
}

export interface EpistemicAlert {
  id: string;
  severity: 'warning' | 'error';
  sceneId: string;
  entityName: string;
  message: string;
}

export interface CompiledMemoryPacket {
  layers: CompiledMemoryLayer[];
  totalEstimatedTokens: number;
  budgetTokens: number;
  truncatedCount: number;
  executionMode: AppSettings['aiMode'];
  canonPermission: CanonAiPermission;
  cloudAllowed: boolean;
  epistemicAlerts: EpistemicAlert[];
  sessionHandoff: string;
  formattedPrompt: string;
}

export interface MemoryCompileOptions {
  budgetTokens?: number;
}

/**
 * Estimates LLM context token count cleanly using a 4-chars-per-token heuristic.
 */
export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.ceil(trimmed.length / 4);
}

function summarizeText(text: string, maxLen = 240): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

function computeLayerTokens(items: CompiledMemoryItem[]): number {
  return items.reduce(
    (sum, item) => sum + estimateTokens(`${item.title}: ${item.summary}`),
    0
  );
}

function isSecretMentionedInProse(secretText: string, proseLower: string): boolean {
  const normalizedSecret = secretText.toLowerCase().trim();
  if (!normalizedSecret || !proseLower) return false;
  if (proseLower.includes(normalizedSecret)) return true;

  const significantWords = normalizedSecret
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4);
  if (significantWords.length < 2) return false;

  const matches = significantWords.filter((word) => proseLower.includes(word));
  return matches.length >= Math.min(3, significantWords.length);
}

function collectEntitySecrets(project: ProjectData): {
  ownerId: string;
  ownerName: string;
  secret: EpistemicSecret;
}[] {
  const entries: { ownerId: string; ownerName: string; secret: EpistemicSecret }[] = [];

  for (const c of project.characters) {
    for (const secret of c.epistemicSecrets) {
      entries.push({ ownerId: c.id, ownerName: c.name, secret });
    }
  }
  for (const f of project.factions) {
    for (const secret of f.epistemicSecrets) {
      entries.push({ ownerId: f.id, ownerName: f.name, secret });
    }
  }
  for (const w of project.worlds) {
    for (const loc of w.locations) {
      for (const secret of loc.epistemicSecrets ?? []) {
        entries.push({ ownerId: loc.id, ownerName: loc.name, secret });
      }
    }
    for (const sys of w.systems) {
      for (const secret of sys.epistemicSecrets ?? []) {
        entries.push({ ownerId: sys.id, ownerName: sys.name, secret });
      }
    }
  }
  for (const obj of project.objects) {
    for (const secret of obj.epistemicSecrets ?? []) {
      entries.push({ ownerId: obj.id, ownerName: obj.name, secret });
    }
  }
  return entries;
}

export function detectSceneEpistemicAlerts(
  project: ProjectData,
  scene: Scene | undefined,
  trackingEnabled: boolean
): EpistemicAlert[] {
  if (!scene || !trackingEnabled) return [];
  const proseLower = scene.content.toLowerCase();
  const povId = scene.povCharacterId;
  const alerts: EpistemicAlert[] = [];

  for (const entry of collectEntitySecrets(project)) {
    const { ownerId, ownerName, secret } = entry;
    const isAlreadyRevealedInScene =
      secret.revealedInSceneId === scene.id ||
      scene.secretsRevealed.includes(secret.id);
    if (isAlreadyRevealedInScene) continue;

    const povKnowsSecret =
      !povId || povId === ownerId || secret.knownByIds.includes(povId);
    if (povKnowsSecret) continue;

    if (isSecretMentionedInProse(secret.secret, proseLower)) {
      alerts.push({
        id: `epi_alert_${scene.id}_${secret.id}`,
        severity: 'warning',
        sceneId: scene.id,
        entityName: ownerName,
        message: `Possível vazamento epistêmico: o POV atual desconhece o segredo "${summarizeText(secret.secret, 70)}" atribuído a ${ownerName}.`,
      });
    }
  }
  return alerts;
}

function buildImmediateLayer(
  project: ProjectData,
  activeView: ViewId,
  activeScene?: Scene
): CompiledMemoryLayer {
  const items: CompiledMemoryItem[] = [];
  if (activeScene) {
    const pov = project.characters.find((c) => c.id === activeScene.povCharacterId);
    const allLocs = project.worlds.flatMap((w) => w.locations);
    const location = allLocs.find((l) => l.id === activeScene.locationId);
    const presentChars = project.characters
      .filter((c) => activeScene.characterIds.includes(c.id))
      .map((c) => c.name);

    items.push({
      id: `imm_scene_${activeScene.id}`,
      title: `Cena Ativa: ${activeScene.title}`,
      summary: [
        `Ato ${activeScene.act} | Cap. ${activeScene.chapterNumber} | Visão: ${activeView}`,
        pov ? `POV: ${pov.name} (${pov.role})` : 'POV não definido',
        location ? `Local: ${location.name}` : 'Local não definido',
        presentChars.length > 0 ? `Em cena: ${presentChars.join(', ')}` : '',
        activeScene.content ? `Trecho: ${summarizeText(activeScene.content, 320)}` : '',
      ]
        .filter(Boolean)
        .join(' • '),
      status: activeScene.status,
    });
  } else {
    items.push({
      id: 'imm_workspace_focus',
      title: `Estúdio Ativo (${activeView})`,
      summary: `${project.title} — ${project.genre}. ${summarizeText(project.logline, 180)}`,
    });
  }
  return {
    id: 'immediate',
    label: '1. Memória de Trabalho (Cena & POV)',
    estimatedTokens: computeLayerTokens(items),
    items,
  };
}

function buildEpistemicLayer(
  project: ProjectData,
  activeScene: Scene | undefined,
  alerts: EpistemicAlert[]
): CompiledMemoryLayer {
  const items: CompiledMemoryItem[] = [];
  const secrets = collectEntitySecrets(project);

  for (const entry of secrets.slice(0, 6)) {
    const knownNames = project.characters
      .filter((c) => entry.secret.knownByIds.includes(c.id))
      .map((c) => c.name);
    const revealedHere =
      activeScene &&
      (entry.secret.revealedInSceneId === activeScene.id ||
        activeScene.secretsRevealed.includes(entry.secret.id));

    items.push({
      id: `epi_${entry.secret.id}`,
      title: `Segredo (${entry.ownerName})`,
      summary: `${summarizeText(entry.secret.secret, 120)} | Sabem: ${
        knownNames.length > 0 ? knownNames.join(', ') : 'Apenas portador/autor'
      }${revealedHere ? ' | Revelado nesta cena' : ''}`,
      status: revealedHere ? 'canon' : 'provisional',
    });
  }

  for (const alert of alerts) {
    items.push({
      id: alert.id,
      title: `Alerta Epistêmico (${alert.entityName})`,
      summary: alert.message,
      status: 'warning',
    });
  }

  return {
    id: 'epistemic',
    label: '2. Memória Episódica & Epistêmica',
    estimatedTokens: computeLayerTokens(items),
    items,
  };
}

function buildWorldCanonLayer(
  project: ProjectData,
  activeScene?: Scene
): CompiledMemoryLayer {
  const items: CompiledMemoryItem[] = [];
  const proseLower = activeScene?.content.toLowerCase() ?? '';

  for (const world of project.worlds) {
    for (const loc of world.locations) {
      const relevant =
        activeScene?.locationId === loc.id ||
        proseLower.includes(loc.name.toLowerCase());
      if (relevant || items.length < 3) {
        items.push({
          id: `canon_loc_${loc.id}`,
          title: `Local: ${loc.name}`,
          summary: summarizeText(loc.description || loc.climateOrAtmosphere, 140),
          status: loc.status ?? 'canon',
        });
      }
    }
    for (const sys of world.systems) {
      if (proseLower.includes(sys.name.toLowerCase()) || items.length < 5) {
        items.push({
          id: `canon_sys_${sys.id}`,
          title: `Sistema/Lei: ${sys.name} (${sys.subtype})`,
          summary: summarizeText(
            sys.fundamentalRules.join('; ') || sys.costsAndToll,
            140
          ),
          status: sys.status ?? 'canon',
        });
      }
    }
  }

  for (const faction of project.factions.slice(0, 3)) {
    items.push({
      id: `canon_fac_${faction.id}`,
      title: `Facção: ${faction.name}`,
      summary: summarizeText(faction.publicAgenda || faction.doctrine, 130),
      status: faction.status,
    });
  }

  for (const obj of project.objects) {
    if (
      activeScene?.objectIds.includes(obj.id) ||
      proseLower.includes(obj.name.toLowerCase())
    ) {
      items.push({
        id: `canon_obj_${obj.id}`,
        title: `Objeto: ${obj.name}`,
        summary: summarizeText(obj.significance || obj.description, 130),
        status: obj.canonStatus ?? 'canon',
      });
    }
  }

  return {
    id: 'world_canon',
    label: '3. Memória Semântica (Mundo & Cânone)',
    estimatedTokens: computeLayerTokens(items),
    items,
  };
}

function buildRollingSummaryLayer(
  project: ProjectData,
  activeScene?: Scene
): CompiledMemoryLayer {
  const items: CompiledMemoryItem[] = [];
  const ordered = [...project.scenes].sort(
    (a, b) => a.act - b.act || a.chapterNumber - b.chapterNumber
  );
  const activeIdx = activeScene
    ? ordered.findIndex((s) => s.id === activeScene.id)
    : ordered.length;
  const preceding = ordered.slice(Math.max(0, activeIdx - 3), Math.max(0, activeIdx));

  for (const prevScene of preceding) {
    items.push({
      id: `roll_scene_${prevScene.id}`,
      title: `Cena Anterior: ${prevScene.title}`,
      summary: summarizeText(prevScene.summary || prevScene.content, 140),
      status: prevScene.status,
    });
  }

  for (const subplot of project.subplots.slice(0, 3)) {
    items.push({
      id: `roll_sub_${subplot.id}`,
      title: `Subtrama: ${subplot.name}`,
      summary: summarizeText(subplot.description, 130),
    });
  }

  items.push({
    id: 'roll_procedural_voice',
    title: 'Voz Procedural do Projeto',
    summary: `Gênero: ${project.genre || 'Narrativa'}. Respeitar continuidade epistêmica, tom literário em Português e travas de Cânone/Staging.`,
  });

  return {
    id: 'rolling_summary',
    label: '4. Síntese Contínua & Voz (Procedural)',
    estimatedTokens: computeLayerTokens(items),
    items,
  };
}

function formatCompiledPrompt(
  layers: CompiledMemoryLayer[],
  handoff: string
): string {
  const blocks = layers.map((layer) => {
    const lines =
      layer.items.length > 0
        ? layer.items.map((it) => `- [${it.title}] ${it.summary}`).join('\n')
        : '- (Sem registros ativos nesta camada)';
    return `## ${layer.label}\n${lines}`;
  });
  return `${blocks.join('\n\n')}\n\n## Handoff da Sessão\n${handoff}`;
}

/**
 * Compiles the 4-layer epistemic and narrative memory packet under the configured token budget.
 */
export function compileFourLayerContext(
  project: ProjectData,
  settings: AppSettings,
  activeView: ViewId,
  activeSceneId?: string,
  options: MemoryCompileOptions = {}
): CompiledMemoryPacket {
  const activeScene =
    project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
  const budgetTokens = Math.max(
    80,
    options.budgetTokens ?? settings.aiMaxTokens ?? 2048
  );
  const alerts = detectSceneEpistemicAlerts(
    project,
    activeScene,
    settings.enableEpistemicTracking
  );

  const layers: CompiledMemoryLayer[] = settings.enableMemoryCompiler
    ? [
        buildImmediateLayer(project, activeView, activeScene),
        buildEpistemicLayer(project, activeScene, alerts),
        buildWorldCanonLayer(project, activeScene),
        buildRollingSummaryLayer(project, activeScene),
      ]
    : [buildImmediateLayer(project, activeView, activeScene)];

  let truncatedCount = 0;
  const trimOrder: MemoryLayerId[] = ['rolling_summary', 'world_canon', 'epistemic'];

  const getTotalTokens = (): number =>
    layers.reduce((sum, l) => sum + l.estimatedTokens, 0);

  for (const targetLayerId of trimOrder) {
    const layer = layers.find((l) => l.id === targetLayerId);
    if (!layer) continue;
    while (getTotalTokens() > budgetTokens && layer.items.length > 0) {
      layer.items.pop();
      layer.estimatedTokens = computeLayerTokens(layer.items);
      truncatedCount += 1;
    }
  }

  const pendingStaging = project.stagingProposals.filter(
    (p) => p.status === 'pending'
  ).length;
  const sessionHandoff = `Ramo ativo: ${
    project.branches.find((b) => b.id === project.activeBranchId)?.name ??
    'Principal'
  } • Cena em foco: ${activeScene?.title ?? 'Nenhuma'} • Staging pendente: ${pendingStaging}`;

  const cloudAllowed =
    settings.copilotEnabled &&
    !settings.copilotHeuristicsOnly &&
    (settings.aiMode === 'cloud' || settings.aiMode === 'hybrid') &&
    (settings.aiProvider === 'gemini' || settings.aiProvider === 'openai');

  return {
    layers,
    totalEstimatedTokens: getTotalTokens(),
    budgetTokens,
    truncatedCount,
    executionMode: settings.aiMode,
    canonPermission: settings.canonAiPermission,
    cloudAllowed,
    epistemicAlerts: alerts,
    sessionHandoff,
    formattedPrompt: formatCompiledPrompt(layers, sessionHandoff),
  };
}
