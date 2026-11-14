import type {
  AppSettings,
  CanonAiPermission,
  Character,
  Faction,
  ProjectData,
  RuleSystem,
  Scene,
  StagingProposal,
  StoryObject,
  WorldLocation,
} from '../types/project';
import { listDirectoryEntities } from './entityDirectory';
import { detectSceneEpistemicAlerts } from './memoryCompiler';
import { countWords } from './wordCounter';

export type CanonFindingCategory =
  | 'uncataloged_entity'
  | 'uncataloged_location'
  | 'uncataloged_object'
  | 'missing_scene_link'
  | 'epistemic_leak';

export type CanonSuggestedEntityKind =
  | 'character'
  | 'faction'
  | 'location'
  | 'object'
  | 'system';

export interface CanonRadarFinding {
  id: string;
  category: CanonFindingCategory;
  suggestedKind: CanonSuggestedEntityKind;
  term: string;
  entityId?: string;
  sceneId?: string;
  sceneTitle?: string;
  excerpt: string;
  rationale: string;
  confidence: number;
  alreadyStaged: boolean;
}

export interface CanonRadarScanResult {
  scannedAt: string;
  scenesScanned: number;
  wordsScanned: number;
  permissionMode: CanonAiPermission;
  findings: CanonRadarFinding[];
  epistemicWarningsCount: number;
}

export type CanonRadarScanSettings = Pick<
  AppSettings,
  | 'canonAiPermission'
  | 'canonScopeEntities'
  | 'canonScopeWorld'
  | 'canonScopeGraphTimeline'
> & { enableEpistemicTracking?: boolean };

const PT_STOP_CAPITALS = new Set([
  'o',
  'a',
  'os',
  'as',
  'um',
  'uma',
  'uns',
  'umas',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'por',
  'para',
  'com',
  'sem',
  'sob',
  'sobre',
  'entre',
  'mas',
  'porém',
  'porem',
  'então',
  'entao',
  'quando',
  'onde',
  'como',
  'porque',
  'pois',
  'enquanto',
  'antes',
  'depois',
  'durante',
  'capítulo',
  'capitulo',
  'cena',
  'ato',
  'prólogo',
  'prologo',
  'epílogo',
  'epilogo',
  'neste',
  'nesta',
  'nesse',
  'nessa',
  'aquele',
  'aquela',
  'aqueles',
  'aquelas',
  'este',
  'esta',
  'esse',
  'essa',
  'tudo',
  'todos',
  'todas',
  'cada',
  'mais',
  'menos',
  'muito',
  'muita',
  'ainda',
  'agora',
  'hoje',
  'ontem',
  'amanhã',
  'amanha',
  'não',
  'nao',
  'sim',
  'ele',
  'ela',
  'eles',
  'elas',
  'você',
  'voce',
  'nós',
  'nos_pron',
  'seu',
  'sua',
  'seus',
  'suas',
  'meu',
  'minha',
]);

function normalizeTerm(raw: string): string {
  return raw.replace(/^[@#&!]+/, '').replace(/[.,;:!?()"'[\]]+$/g, '').trim();
}

function slugifyTerm(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildExcerpt(content: string, term: string): string {
  const idx = content.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return content.slice(0, 120).replace(/\s+/g, ' ').trim();
  const start = Math.max(0, idx - 45);
  const end = Math.min(content.length, idx + term.length + 75);
  const snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();
  return `${start > 0 ? '…' : ''}${snippet}${end < content.length ? '…' : ''}`;
}

function inferPrefixKind(prefix: string): CanonSuggestedEntityKind {
  if (prefix === '#') return 'location';
  if (prefix === '&') return 'faction';
  if (prefix === '!') return 'object';
  return 'character';
}

function categoryForKind(kind: CanonSuggestedEntityKind): CanonFindingCategory {
  if (kind === 'location') return 'uncataloged_location';
  if (kind === 'object') return 'uncataloged_object';
  return 'uncataloged_entity';
}

function isKnownNameOrAlias(
  termLower: string,
  knownNames: Map<string, { id: string; kind: CanonSuggestedEntityKind }>
): boolean {
  if (knownNames.has(termLower)) return true;
  for (const key of knownNames.keys()) {
    if (key.length >= 4 && key === termLower) return true;
  }
  return false;
}

function buildKnownLookup(
  project: ProjectData
): Map<string, { id: string; kind: CanonSuggestedEntityKind }> {
  const map = new Map<string, { id: string; kind: CanonSuggestedEntityKind }>();
  for (const ent of listDirectoryEntities(project)) {
    map.set(ent.name.toLowerCase(), { id: ent.id, kind: ent.kind });
    for (const alias of ent.aliases) {
      if (alias.trim()) {
        map.set(alias.trim().toLowerCase(), { id: ent.id, kind: ent.kind });
      }
    }
  }
  return map;
}

function scanExplicitTagsAndProperNouns(
  scene: Scene,
  knownNames: Map<string, { id: string; kind: CanonSuggestedEntityKind }>,
  pendingNamesLower: Set<string>,
  scopeSettings: CanonRadarScanSettings
): CanonRadarFinding[] {
  const findings: CanonRadarFinding[] = [];
  const seenInScene = new Set<string>();

  // 1. Explicit inline tags: @Personagem, #Local, &Facção, !Objeto
  const tagRegex = /([@#&!])([\p{L}\p{N}_-]{2,}(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}\p{N}_-]+)?)/gu;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRegex.exec(scene.content)) !== null) {
    const prefix = tagMatch[1];
    const term = normalizeTerm(tagMatch[2]);
    if (term.length < 2) continue;
    const termLower = term.toLowerCase();
    const suggestedKind = inferPrefixKind(prefix);

    if (
      (suggestedKind === 'character' ||
        suggestedKind === 'faction' ||
        suggestedKind === 'object') &&
      !scopeSettings.canonScopeEntities
    ) {
      continue;
    }
    if (
      (suggestedKind === 'location' || suggestedKind === 'system') &&
      !scopeSettings.canonScopeWorld
    ) {
      continue;
    }

    if (isKnownNameOrAlias(termLower, knownNames) || seenInScene.has(termLower)) {
      continue;
    }
    seenInScene.add(termLower);

    findings.push({
      id: `finding_tag_${scene.id}_${slugifyTerm(term)}`,
      category: categoryForKind(suggestedKind),
      suggestedKind,
      term,
      sceneId: scene.id,
      sceneTitle: scene.title,
      excerpt: buildExcerpt(scene.content, `${prefix}${term}`),
      rationale: `Marcação explícita "${prefix}${term}" detectada na cena "${scene.title}" sem ficha canônica correspondente.`,
      confidence: 0.96,
      alreadyStaged: pendingNamesLower.has(termLower),
    });
  }

  // 2. Multi-word capitalized proper nouns or recurring standalone mid-sentence capitals
  const multiWordRegex = /\b([\p{Lu}][\p{L}'-]{2,}(?:\s+(?:de|da|do|dos|das|e)?\s*[\p{Lu}][\p{L}'-]{2,}){1,3})\b/gu;
  let mwMatch: RegExpExecArray | null;
  while ((mwMatch = multiWordRegex.exec(scene.content)) !== null) {
    const rawPhrase = normalizeTerm(mwMatch[1]);
    const words = rawPhrase.split(/\s+/);
    if (words.some((w) => PT_STOP_CAPITALS.has(w.toLowerCase()) && w === words[0])) {
      continue;
    }
    const phraseLower = rawPhrase.toLowerCase();
    if (isKnownNameOrAlias(phraseLower, knownNames) || seenInScene.has(phraseLower)) {
      continue;
    }
    seenInScene.add(phraseLower);

    const lower = phraseLower;
    const suggestedKind: CanonSuggestedEntityKind =
      /(valle|vale|cidade|reino|torre|fortaleza|il[h]a|montanha|floresta|porto|citadela|cidadela|templo|mar)/i.test(
        lower
      )
        ? 'location'
        : /(ordem|conselho|guilda|clã|cla|império|imperio|irmandade|liga|sindicato|casa)/i.test(
              lower
            )
          ? 'faction'
          : /(lâmina|lamina|espada|coroa|anel|artefato|tomo|códice|codice|amuleto|chave|grimório|grimorio)/i.test(
                lower
              )
            ? 'object'
            : 'character';

    if (
      (suggestedKind === 'character' ||
        suggestedKind === 'faction' ||
        suggestedKind === 'object') &&
      !scopeSettings.canonScopeEntities
    ) {
      continue;
    }
    if (suggestedKind === 'location' && !scopeSettings.canonScopeWorld) {
      continue;
    }

    findings.push({
      id: `finding_noun_${scene.id}_${slugifyTerm(rawPhrase)}`,
      category: categoryForKind(suggestedKind),
      suggestedKind,
      term: rawPhrase,
      sceneId: scene.id,
      sceneTitle: scene.title,
      excerpt: buildExcerpt(scene.content, rawPhrase),
      rationale: `Nome próprio composto "${rawPhrase}" citado na prosa de "${scene.title}" ainda não catalogado no universo.`,
      confidence: 0.84,
      alreadyStaged: pendingNamesLower.has(phraseLower),
    });
  }

  return findings;
}

function scanMissingSceneLinks(
  project: ProjectData,
  scene: Scene
): CanonRadarFinding[] {
  const findings: CanonRadarFinding[] = [];
  const lower = scene.content.toLowerCase();

  for (const char of project.characters) {
    const mentioned =
      lower.includes(char.name.toLowerCase()) ||
      char.aliases.some((a) => a.trim().length > 1 && lower.includes(a.toLowerCase()));
    if (mentioned && !scene.characterIds.includes(char.id)) {
      findings.push({
        id: `finding_link_char_${scene.id}_${char.id}`,
        category: 'missing_scene_link',
        suggestedKind: 'character',
        term: char.name,
        entityId: char.id,
        sceneId: scene.id,
        sceneTitle: scene.title,
        excerpt: buildExcerpt(scene.content, char.name),
        rationale: `Personagem "${char.name}" aparece na prosa de "${scene.title}", mas não está vinculado nos metadados da cena.`,
        confidence: 0.92,
        alreadyStaged: false,
      });
    }
  }

  for (const world of project.worlds) {
    for (const loc of world.locations) {
      const mentioned =
        lower.includes(loc.name.toLowerCase()) ||
        (loc.aliases ?? []).some((a) => a.trim().length > 1 && lower.includes(a.toLowerCase()));
      if (mentioned && scene.locationId !== loc.id) {
        findings.push({
          id: `finding_link_loc_${scene.id}_${loc.id}`,
          category: 'missing_scene_link',
          suggestedKind: 'location',
          term: loc.name,
          entityId: loc.id,
          sceneId: scene.id,
          sceneTitle: scene.title,
          excerpt: buildExcerpt(scene.content, loc.name),
          rationale: `Local "${loc.name}" mencionado na prosa de "${scene.title}", porém a cena ainda não aponta este cenário.`,
          confidence: 0.88,
          alreadyStaged: false,
        });
      }
    }
  }

  return findings;
}

/**
 * Scans manuscript scenes for uncataloged @/#/&/! mentions, proper nouns, missing scene links,
 * and epistemic secret leaks while strictly respecting active canon scope filters.
 */
export function scanProjectCanon(
  project: ProjectData,
  settings: CanonRadarScanSettings
): CanonRadarScanResult {
  const knownNames = buildKnownLookup(project);
  const pendingNamesLower = new Set(
    project.stagingProposals
      .filter((p) => p.status === 'pending')
      .map((p) => p.entityName.toLowerCase())
  );

  const findings: CanonRadarFinding[] = [];
  let wordsScanned = 0;
  let epistemicWarningsCount = 0;

  for (const scene of project.scenes) {
    wordsScanned += countWords(scene.content);
    findings.push(
      ...scanExplicitTagsAndProperNouns(scene, knownNames, pendingNamesLower, settings)
    );

    if (settings.canonScopeGraphTimeline) {
      findings.push(...scanMissingSceneLinks(project, scene));
      const alerts = detectSceneEpistemicAlerts(
        project,
        scene,
        settings.enableEpistemicTracking ?? true
      );
      for (const alert of alerts) {
        epistemicWarningsCount += 1;
        findings.push({
          id: `finding_${alert.id}`,
          category: 'epistemic_leak',
          suggestedKind: 'character',
          term: alert.entityName,
          sceneId: scene.id,
          sceneTitle: scene.title,
          excerpt: alert.message,
          rationale: alert.message,
          confidence: 0.91,
          alreadyStaged: false,
        });
      }
    }
  }

  // Deduplicate uncataloged discoveries across scenes by term + suggestedKind
  const deduped: CanonRadarFinding[] = [];
  const seenDiscoveryKeys = new Set<string>();
  for (const item of findings) {
    if (
      item.category === 'uncataloged_entity' ||
      item.category === 'uncataloged_location' ||
      item.category === 'uncataloged_object'
    ) {
      const key = `${item.suggestedKind}:${item.term.toLowerCase()}`;
      if (seenDiscoveryKeys.has(key)) continue;
      seenDiscoveryKeys.add(key);
    }
    deduped.push(item);
  }

  return {
    scannedAt: new Date().toISOString(),
    scenesScanned: project.scenes.length,
    wordsScanned,
    permissionMode: settings.canonAiPermission,
    findings: deduped,
    epistemicWarningsCount,
  };
}

function mapSuggestedKindToProposalType(
  kind: CanonSuggestedEntityKind
): StagingProposal['entityType'] {
  if (kind === 'object') return 'item';
  return kind;
}

/**
 * Converts a Canon Radar finding into a non-destructive YAML + Markdown StagingProposal.
 */
export function createStagingProposalFromFinding(
  finding: CanonRadarFinding
): StagingProposal {
  const slug = slugifyTerm(finding.term) || `${Date.now()}`;
  const entityType = mapSuggestedKindToProposalType(finding.suggestedKind);
  const id = `${entityType}_${slug}`;
  const folderMap: Record<StagingProposal['entityType'], string> = {
    character: 'characters',
    faction: 'factions',
    location: 'locations',
    system: 'systems',
    item: 'objects',
    scene: 'manuscript',
  };
  const folder = folderMap[entityType];
  const fileName = `${slug}.md`;

  const proposedMarkdown = [
    `# ${finding.term}`,
    '',
    `Descoberto automaticamente pelo **Radar de Cânone**${finding.sceneTitle ? ` na cena *${finding.sceneTitle}*` : ''}.`,
    '',
    finding.excerpt ? `> ${finding.excerpt}` : '',
    '',
    `Justificativa: ${finding.rationale}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    id: `stg_radar_${slug}_${Date.now()}`,
    fileName,
    targetPath: `workspace/staging/${fileName}`,
    canonicalPath: `workspace/lore/${folder}/${fileName}`,
    entityType,
    entityName: finding.term,
    action: finding.entityId ? 'update' : 'create',
    rationale: finding.rationale,
    createdAt: new Date().toISOString(),
    status: 'pending',
    epistemicImpact:
      finding.category === 'epistemic_leak'
        ? [finding.rationale]
        : finding.sceneId
          ? [`Referenciado em ${finding.sceneTitle ?? finding.sceneId}`]
          : [],
    proposedFrontmatter: {
      id,
      type: entityType,
      name: finding.term,
      status: 'provisional',
      tags: ['radar-canone'],
    },
    proposedMarkdown,
  };
}

/**
 * Applies Mode 3 (Auto-Catalogar Universo) for a single finding: creates the provisional dossier
 * or repairs missing scene metadata links without altering manuscript prose content.
 */
export function applyAutoCatalogFinding(
  project: ProjectData,
  finding: CanonRadarFinding
): { updatedProject: ProjectData; summary: string } {
  const slug = slugifyTerm(finding.term) || `${Date.now()}`;
  const noteText = finding.excerpt
    ? `Detectado na cena "${finding.sceneTitle ?? 'Manuscrito'}": ${finding.excerpt}`
    : finding.rationale;

  // Missing scene metadata link -> link entityId into the scene without editing scene.content
  if (finding.category === 'missing_scene_link' && finding.sceneId && finding.entityId) {
    const nextScenes = project.scenes.map((sc) => {
      if (sc.id !== finding.sceneId) return sc;
      if (finding.suggestedKind === 'location' && !sc.locationId) {
        return { ...sc, locationId: finding.entityId };
      }
      if (
        finding.suggestedKind === 'character' &&
        !sc.characterIds.includes(finding.entityId!)
      ) {
        return {
          ...sc,
          characterIds: [...sc.characterIds, finding.entityId!],
        };
      }
      return sc;
    });
    return {
      updatedProject: { ...project, scenes: nextScenes },
      summary: `Vínculo restaurado em "${finding.sceneTitle}": ${finding.term}.`,
    };
  }

  // Create new provisional canon entry if not yet cataloged
  const known = buildKnownLookup(project);
  if (known.has(finding.term.toLowerCase())) {
    return {
      updatedProject: project,
      summary: `${finding.term} já existe no catálogo do universo.`,
    };
  }

  if (finding.suggestedKind === 'character') {
    const newChar: Character = {
      id: `char_${slug}_${Date.now()}`,
      name: finding.term,
      aliases: [],
      role: 'Descoberto no Manuscrito',
      archetype: 'ally',
      status: 'provisional',
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
      notes: noteText,
      tags: ['auto-catalogado'],
      relationships: [],
      epistemicSecrets: [],
    };
    const nextScenes = finding.sceneId
      ? project.scenes.map((sc) =>
          sc.id === finding.sceneId
            ? { ...sc, characterIds: [...sc.characterIds, newChar.id] }
            : sc
        )
      : project.scenes;
    return {
      updatedProject: {
        ...project,
        characters: [...project.characters, newChar],
        scenes: nextScenes,
      },
      summary: `Personagem "${finding.term}" catalogado em estado provisório.`,
    };
  }

  if (finding.suggestedKind === 'faction') {
    const newFaction: Faction = {
      id: `fac_${slug}_${Date.now()}`,
      name: finding.term,
      aliases: [],
      subtype: 'Organização Descoberta',
      motto: '',
      color: '#a855f7',
      status: 'provisional',
      publicAgenda: finding.rationale,
      secretAgenda: '',
      doctrine: '',
      history: '',
      resourcesAndPower: '',
      internalConflicts: '',
      notes: noteText,
      ranks: [],
      controlledLocationIds: [],
      tags: ['auto-catalogado'],
      relationships: [],
      epistemicSecrets: [],
    };
    return {
      updatedProject: {
        ...project,
        factions: [...project.factions, newFaction],
      },
      summary: `Facção "${finding.term}" catalogada em estado provisório.`,
    };
  }

  if (finding.suggestedKind === 'object') {
    const newObj: StoryObject = {
      id: `obj_${slug}_${Date.now()}`,
      name: finding.term,
      type: 'artifact',
      canonStatus: 'provisional',
      status: 'Em posse / indefinido',
      description: noteText,
      significance: finding.rationale,
      rulesOrCapabilities: '',
      linkedCharacterIds: [],
      linkedSceneIds: finding.sceneId ? [finding.sceneId] : [],
      notes: noteText,
      tags: ['auto-catalogado'],
      relationships: [],
      epistemicSecrets: [],
    };
    return {
      updatedProject: {
        ...project,
        objects: [...project.objects, newObj],
      },
      summary: `Objeto "${finding.term}" catalogado em estado provisório.`,
    };
  }

  if (finding.suggestedKind === 'location' && project.worlds.length > 0) {
    const targetWorld = project.worlds[0];
    const newLoc: WorldLocation = {
      id: `loc_${slug}_${Date.now()}`,
      worldId: targetWorld.id,
      name: finding.term,
      type: 'region',
      status: 'provisional',
      climateOrAtmosphere: 'A definir',
      description: noteText,
      strategicValue: '',
      coordinates: { x: 50, y: 50 },
      connectedLocationIds: [],
      notes: noteText,
      tags: ['auto-catalogado'],
      relationships: [],
      epistemicSecrets: [],
    };
    const nextWorlds = [
      { ...targetWorld, locations: [...targetWorld.locations, newLoc] },
      ...project.worlds.slice(1),
    ];
    return {
      updatedProject: { ...project, worlds: nextWorlds },
      summary: `Local "${finding.term}" adicionado ao mundo "${targetWorld.name}".`,
    };
  }

  if (finding.suggestedKind === 'system' && project.worlds.length > 0) {
    const targetWorld = project.worlds[0];
    const newSys: RuleSystem = {
      id: `sys_${slug}_${Date.now()}`,
      worldId: targetWorld.id,
      name: finding.term,
      subtype: 'Sistema Descoberto',
      status: 'provisional',
      coreSource: '',
      fundamentalRules: [],
      costsAndToll: '',
      hardLimits: [],
      socialTaboos: '',
      knownPractitionerIds: [],
      notes: noteText,
      tags: ['auto-catalogado'],
    };
    const nextWorlds = [
      { ...targetWorld, systems: [...targetWorld.systems, newSys] },
      ...project.worlds.slice(1),
    ];
    return {
      updatedProject: { ...project, worlds: nextWorlds },
      summary: `Sistema "${finding.term}" adicionado ao mundo "${targetWorld.name}".`,
    };
  }

  return {
    updatedProject: project,
    summary: `Sem alteração automática aplicável para ${finding.term}.`,
  };
}

/**
 * Applies Auto-Catalog in batch across multiple eligible findings while keeping scene prose intact.
 */
export function applyAutoCatalogBatch(
  project: ProjectData,
  findings: CanonRadarFinding[]
): { updatedProject: ProjectData; catalogedCount: number; summaries: string[] } {
  let current = project;
  const summaries: string[] = [];
  let catalogedCount = 0;

  for (const finding of findings) {
    if (finding.category === 'epistemic_leak') continue;
    const { updatedProject, summary } = applyAutoCatalogFinding(current, finding);
    if (updatedProject !== current) {
      current = updatedProject;
      catalogedCount += 1;
      summaries.push(summary);
    }
  }

  return { updatedProject: current, catalogedCount, summaries };
}
