import type { ProjectData } from '../types/project';
import { createBlankProjectData } from '../data/blankProjectFactory';

/**
 * Allows only valid http:// or https:// external URLs.
 * Blocks javascript:, data:, vbscript:, file:, or malformed URLs.
 */
export function sanitizeExternalUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Safely normalizes arbitrary JSON into a valid ProjectData object,
 * defaulting any missing arrays, nested objects, or scalar goals so
 * partial or malformed JSON never crashes the React component tree.
 */
export function normalizeWorkspaceData(raw: unknown): ProjectData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.title !== 'string' || !obj.title.trim()) {
    return null;
  }

  const base = createBlankProjectData(obj.title.trim());
  const rawCompile =
    obj.compileProfile && typeof obj.compileProfile === 'object' && !Array.isArray(obj.compileProfile)
      ? (obj.compileProfile as Record<string, unknown>)
      : {};

  const safeArray = <T>(val: unknown, fallback: T[]): T[] =>
    Array.isArray(val) ? (val as T[]) : fallback;

  const normalizedBinder = safeArray(obj.binder, base.binder).map((b) => ({
    ...b,
    url: b && typeof b === 'object' && 'url' in b ? sanitizeExternalUrl((b as { url?: string }).url) : undefined,
    linkedSceneIds: Array.isArray(b?.linkedSceneIds) ? b.linkedSceneIds : [],
  }));

  const normalizedWorlds = safeArray(obj.worlds, base.worlds).map((w) => ({
    ...w,
    locations: Array.isArray(w?.locations) ? w.locations : [],
    timeline: Array.isArray(w?.timeline) ? w.timeline : [],
    systems: Array.isArray(w?.systems) ? w.systems : [],
  }));

  const normalizedBranches = safeArray(obj.branches, base.branches);

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : base.id,
    title: obj.title.trim(),
    logline: typeof obj.logline === 'string' ? obj.logline : base.logline,
    genre: typeof obj.genre === 'string' ? obj.genre : base.genre,
    isFavorite: typeof obj.isFavorite === 'boolean' ? obj.isFavorite : false,
    isArchived: typeof obj.isArchived === 'boolean' ? obj.isArchived : false,
    folderOrTag: typeof obj.folderOrTag === 'string' ? obj.folderOrTag : 'Geral',
    accentColor: typeof obj.accentColor === 'string' ? obj.accentColor : '#3b82f6',
    lastOpenedAt: typeof obj.lastOpenedAt === 'string' ? obj.lastOpenedAt : base.updatedAt,
    wordCountGoal:
      typeof obj.wordCountGoal === 'number' && obj.wordCountGoal > 0
        ? obj.wordCountGoal
        : base.wordCountGoal,
    dailyWordGoal:
      typeof obj.dailyWordGoal === 'number' && obj.dailyWordGoal > 0
        ? obj.dailyWordGoal
        : base.dailyWordGoal,
    weeklyWordGoal:
      typeof obj.weeklyWordGoal === 'number' && obj.weeklyWordGoal > 0
        ? obj.weeklyWordGoal
        : base.weeklyWordGoal,
    deadline: typeof obj.deadline === 'string' ? obj.deadline : undefined,
    characters: safeArray(obj.characters, base.characters).map((c) => ({
      ...c,
      aliases: Array.isArray(c?.aliases) ? c.aliases : [],
      tags: Array.isArray(c?.tags) ? c.tags : [],
      relationships: Array.isArray(c?.relationships) ? c.relationships : [],
      epistemicSecrets: Array.isArray(c?.epistemicSecrets) ? c.epistemicSecrets : [],
    })),
    factions: safeArray(obj.factions, base.factions).map((f) => ({
      ...f,
      aliases: Array.isArray(f?.aliases) ? f.aliases : [],
      ranks: Array.isArray(f?.ranks) ? f.ranks : [],
      controlledLocationIds: Array.isArray(f?.controlledLocationIds) ? f.controlledLocationIds : [],
      tags: Array.isArray(f?.tags) ? f.tags : [],
      relationships: Array.isArray(f?.relationships) ? f.relationships : [],
      epistemicSecrets: Array.isArray(f?.epistemicSecrets) ? f.epistemicSecrets : [],
    })),
    worlds: normalizedWorlds.length > 0 ? normalizedWorlds : base.worlds,
    objects: safeArray(obj.objects, base.objects).map((o) => ({
      ...o,
      linkedCharacterIds: Array.isArray(o?.linkedCharacterIds) ? o.linkedCharacterIds : [],
      linkedSceneIds: Array.isArray(o?.linkedSceneIds) ? o.linkedSceneIds : [],
    })),
    objectGroups: safeArray(obj.objectGroups, base.objectGroups),
    scenes: safeArray(obj.scenes, base.scenes).map((s, idx) => ({
      ...base.scenes[0],
      ...s,
      chapterNumber: typeof s?.chapterNumber === 'number' ? s.chapterNumber : idx + 1,
      subplotIds: Array.isArray(s?.subplotIds) ? s.subplotIds : [],
      characterIds: Array.isArray(s?.characterIds) ? s.characterIds : [],
      objectIds: Array.isArray(s?.objectIds) ? s.objectIds : [],
      secretsRevealed: Array.isArray(s?.secretsRevealed) ? s.secretsRevealed : [],
      comments: Array.isArray(s?.comments) ? s.comments : [],
      revisions: Array.isArray(s?.revisions) ? s.revisions : [],
      position:
        s?.position && typeof s.position === 'object'
          ? s.position
          : { x: 100 + idx * 240, y: 120 },
    })),
    outline: safeArray(obj.outline, base.outline),
    subplots: safeArray(obj.subplots, base.subplots),
    plotConnections: safeArray(obj.plotConnections, base.plotConnections),
    binder: normalizedBinder,
    interviews: safeArray(obj.interviews, base.interviews),
    mindMaps: safeArray(obj.mindMaps, base.mindMaps),
    branches: normalizedBranches.length > 0 ? normalizedBranches : base.branches,
    activeBranchId:
      typeof obj.activeBranchId === 'string' && obj.activeBranchId
        ? obj.activeBranchId
        : normalizedBranches[0]?.id ?? base.activeBranchId,
    snapshots: safeArray(obj.snapshots, base.snapshots),
    stagingProposals: safeArray(obj.stagingProposals, base.stagingProposals),
    writingLogs: safeArray(obj.writingLogs, base.writingLogs),
    compileProfile: {
      authorName: typeof rawCompile.authorName === 'string' ? rawCompile.authorName : '',
      titlePageText:
        typeof rawCompile.titlePageText === 'string' ? rawCompile.titlePageText : obj.title.trim(),
      dedication: typeof rawCompile.dedication === 'string' ? rawCompile.dedication : '',
      acknowledgements:
        typeof rawCompile.acknowledgements === 'string' ? rawCompile.acknowledgements : '',
      imprint: typeof rawCompile.imprint === 'string' ? rawCompile.imprint : '',
    },
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : base.updatedAt,
  };
}
