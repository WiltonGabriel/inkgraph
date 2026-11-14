import type {
  Branch,
  Character,
  Faction,
  OutlineSection,
  PlotConnection,
  ProjectData,
  Scene,
  Snapshot,
  StoryObject,
  Subplot,
  World,
} from '../types/project';
import { countWords } from './wordCounter';

export interface DiffLine {
  type: 'equal' | 'insert' | 'delete';
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface WordDiffToken {
  type: 'equal' | 'insert' | 'delete';
  value: string;
}

export interface BranchSceneConflict {
  sceneId: string;
  title: string;
  activeContent: string;
  incomingContent: string;
  activeUpdatedAt: string;
  incomingUpdatedAt: string;
}

export interface BranchDiffSummary {
  sourceBranchId: string;
  targetBranchId: string;
  scenesAdded: string[];
  scenesModified: string[];
  scenesRemoved: string[];
  entitiesChanged: number;
  conflicts: BranchSceneConflict[];
  lineDiffBySceneId: Record<string, DiffLine[]>;
}

export interface BranchSnapshotState {
  scenes: Scene[];
  characters: Character[];
  factions: Faction[];
  worlds: World[];
  objects: StoryObject[];
  outline: OutlineSection[];
  subplots: Subplot[];
  plotConnections: PlotConnection[];
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function computeLcsTable<T>(a: readonly T[], b: readonly T[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array<number>(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

/**
 * Computes a deterministic line-by-line LCS diff between baseText and targetText.
 */
export function computeLineDiff(baseText: string, targetText: string): DiffLine[] {
  const baseLines = baseText === '' ? [] : baseText.split(/\r?\n/);
  const targetLines = targetText === '' ? [] : targetText.split(/\r?\n/);
  const dp = computeLcsTable(baseLines, targetLines);
  const result: DiffLine[] = [];

  let i = 0;
  let j = 0;
  while (i < baseLines.length && j < targetLines.length) {
    if (baseLines[i] === targetLines[j]) {
      result.push({
        type: 'equal',
        text: baseLines[i],
        oldLineNumber: i + 1,
        newLineNumber: j + 1,
      });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'delete', text: baseLines[i], oldLineNumber: i + 1 });
      i += 1;
    } else {
      result.push({ type: 'insert', text: targetLines[j], newLineNumber: j + 1 });
      j += 1;
    }
  }
  while (i < baseLines.length) {
    result.push({ type: 'delete', text: baseLines[i], oldLineNumber: i + 1 });
    i += 1;
  }
  while (j < targetLines.length) {
    result.push({ type: 'insert', text: targetLines[j], newLineNumber: j + 1 });
    j += 1;
  }
  return result;
}

/**
 * Computes a deterministic word/whitespace token LCS diff between baseText and targetText.
 */
export function computeWordDiff(
  baseText: string,
  targetText: string
): WordDiffToken[] {
  const tokenize = (input: string): string[] =>
    input === '' ? [] : input.split(/(\s+)/).filter((t) => t.length > 0);
  const baseTokens = tokenize(baseText);
  const targetTokens = tokenize(targetText);
  const dp = computeLcsTable(baseTokens, targetTokens);
  const result: WordDiffToken[] = [];

  let i = 0;
  let j = 0;
  while (i < baseTokens.length && j < targetTokens.length) {
    if (baseTokens[i] === targetTokens[j]) {
      result.push({ type: 'equal', value: baseTokens[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'delete', value: baseTokens[i] });
      i += 1;
    } else {
      result.push({ type: 'insert', value: targetTokens[j] });
      j += 1;
    }
  }
  while (i < baseTokens.length) {
    result.push({ type: 'delete', value: baseTokens[i] });
    i += 1;
  }
  while (j < targetTokens.length) {
    result.push({ type: 'insert', value: targetTokens[j] });
    j += 1;
  }
  return result;
}

/**
 * Serializes the mutable narrative and worldbuilding state of a project into JSON.
 */
export function serializeBranchState(project: ProjectData): string {
  const payload: BranchSnapshotState = {
    scenes: project.scenes,
    characters: project.characters,
    factions: project.factions,
    worlds: project.worlds,
    objects: project.objects,
    outline: project.outline,
    subplots: project.subplots,
    plotConnections: project.plotConnections,
  };
  return JSON.stringify(payload);
}

/**
 * Safely parses a serialized branch state payload back into partial ProjectData fields.
 */
export function parseBranchState(
  snapshotData?: string
): Partial<BranchSnapshotState> | null {
  if (!snapshotData || typeof snapshotData !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(snapshotData);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Partial<BranchSnapshotState>;
  } catch {
    return null;
  }
}

function resolveBranchSnapshot(
  branch: Branch | undefined,
  fallbackProject?: ProjectData
): BranchSnapshotState {
  const parsed = parseBranchState(branch?.snapshotData);
  const scenes = parsed?.scenes ?? branch?.scenesBackup ?? fallbackProject?.scenes ?? [];
  return {
    scenes: deepClone(scenes),
    characters: deepClone(parsed?.characters ?? fallbackProject?.characters ?? []),
    factions: deepClone(parsed?.factions ?? fallbackProject?.factions ?? []),
    worlds: deepClone(parsed?.worlds ?? fallbackProject?.worlds ?? []),
    objects: deepClone(parsed?.objects ?? fallbackProject?.objects ?? []),
    outline: deepClone(parsed?.outline ?? fallbackProject?.outline ?? []),
    subplots: deepClone(parsed?.subplots ?? fallbackProject?.subplots ?? []),
    plotConnections: deepClone(
      parsed?.plotConnections ?? fallbackProject?.plotConnections ?? []
    ),
  };
}

function captureCurrentBranchSnapshot(project: ProjectData): Branch[] {
  const serialized = serializeBranchState(project);
  const clonedScenes = deepClone(project.scenes);
  return project.branches.map((branch) =>
    branch.id === project.activeBranchId
      ? { ...branch, scenesBackup: clonedScenes, snapshotData: serialized }
      : branch
  );
}

/**
 * Saves current working tree to the active branch, creates a new branch clone, and activates it.
 */
export function createBranchFromActive(
  project: ProjectData,
  name: string,
  description: string
): ProjectData {
  const serialized = serializeBranchState(project);
  const clonedScenes = deepClone(project.scenes);
  const updatedBranches = captureCurrentBranchSnapshot(project);
  const newBranch: Branch = {
    id: `branch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || 'Nova Ramificação',
    description: description.trim(),
    createdAt: new Date().toISOString().slice(0, 10),
    scenesBackup: clonedScenes,
    snapshotData: serialized,
  };
  return {
    ...project,
    branches: [...updatedBranches, newBranch],
    activeBranchId: newBranch.id,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Persists the current branch working state and checks out targetBranchId cleanly.
 */
export function checkoutBranchState(
  project: ProjectData,
  targetBranchId: string
): ProjectData {
  if (targetBranchId === project.activeBranchId) return project;
  const targetBranch = project.branches.find((b) => b.id === targetBranchId);
  if (!targetBranch) return project;

  const updatedBranches = captureCurrentBranchSnapshot(project);
  const nextState = resolveBranchSnapshot(targetBranch, project);

  return {
    ...project,
    branches: updatedBranches,
    activeBranchId: targetBranchId,
    scenes: nextState.scenes,
    characters: nextState.characters,
    factions: nextState.factions,
    worlds: nextState.worlds,
    objects: nextState.objects,
    outline: nextState.outline,
    subplots: nextState.subplots,
    plotConnections: nextState.plotConnections,
    updatedAt: new Date().toISOString(),
  };
}

function countEntityChanges(
  activeProject: ProjectData,
  sourceState: BranchSnapshotState
): number {
  const compareCollections = <T>(a: T[], b: T[]): number =>
    JSON.stringify(a) === JSON.stringify(b) ? 0 : Math.max(1, Math.abs(a.length - b.length) || 1);

  return (
    compareCollections(activeProject.characters, sourceState.characters) +
    compareCollections(activeProject.factions, sourceState.factions) +
    compareCollections(activeProject.worlds, sourceState.worlds) +
    compareCollections(activeProject.objects, sourceState.objects) +
    compareCollections(activeProject.outline, sourceState.outline) +
    compareCollections(activeProject.subplots, sourceState.subplots)
  );
}

/**
 * Compares a source branch against the current active branch working state.
 */
export function computeWorkspaceBranchDiff(
  project: ProjectData,
  sourceBranchId: string
): BranchDiffSummary {
  const sourceBranch = project.branches.find((b) => b.id === sourceBranchId);
  const targetBranchId = project.activeBranchId;

  if (!sourceBranch) {
    return {
      sourceBranchId,
      targetBranchId,
      scenesAdded: [],
      scenesModified: [],
      scenesRemoved: [],
      entitiesChanged: 0,
      conflicts: [],
      lineDiffBySceneId: {},
    };
  }

  const sourceState = resolveBranchSnapshot(sourceBranch, project);
  const activeSceneMap = new Map(project.scenes.map((s) => [s.id, s]));
  const sourceSceneMap = new Map(sourceState.scenes.map((s) => [s.id, s]));

  const scenesAdded: string[] = [];
  const scenesModified: string[] = [];
  const scenesRemoved: string[] = [];
  const conflicts: BranchSceneConflict[] = [];
  const lineDiffBySceneId: Record<string, DiffLine[]> = {};

  for (const srcScene of sourceState.scenes) {
    const activeScene = activeSceneMap.get(srcScene.id);
    if (!activeScene) {
      scenesAdded.push(srcScene.id);
      lineDiffBySceneId[srcScene.id] = computeLineDiff('', srcScene.content);
      continue;
    }
    const contentChanged = activeScene.content !== srcScene.content;
    const metaChanged =
      activeScene.title !== srcScene.title ||
      activeScene.summary !== srcScene.summary ||
      activeScene.status !== srcScene.status;

    if (contentChanged || metaChanged) {
      scenesModified.push(srcScene.id);
      lineDiffBySceneId[srcScene.id] = computeLineDiff(
        activeScene.content,
        srcScene.content
      );
      if (contentChanged) {
        conflicts.push({
          sceneId: srcScene.id,
          title: srcScene.title || activeScene.title,
          activeContent: activeScene.content,
          incomingContent: srcScene.content,
          activeUpdatedAt: activeScene.lastEditedAt,
          incomingUpdatedAt: srcScene.lastEditedAt,
        });
      }
    }
  }

  for (const activeScene of project.scenes) {
    if (!sourceSceneMap.has(activeScene.id)) {
      scenesRemoved.push(activeScene.id);
      lineDiffBySceneId[activeScene.id] = computeLineDiff(activeScene.content, '');
    }
  }

  return {
    sourceBranchId,
    targetBranchId,
    scenesAdded,
    scenesModified,
    scenesRemoved,
    entitiesChanged: countEntityChanges(project, sourceState),
    conflicts,
    lineDiffBySceneId,
  };
}

/**
 * Merges a source branch into the active working branch, honoring conflictResolutions per scene.
 */
export function mergeBranchIntoActive(
  project: ProjectData,
  sourceBranchId: string,
  conflictResolutions: Record<string, 'ours' | 'theirs'> = {}
): { updatedProject: ProjectData; mergedScenes: number; resolvedConflicts: number } {
  if (sourceBranchId === project.activeBranchId) {
    return { updatedProject: project, mergedScenes: 0, resolvedConflicts: 0 };
  }
  const sourceBranch = project.branches.find((b) => b.id === sourceBranchId);
  if (!sourceBranch) {
    return { updatedProject: project, mergedScenes: 0, resolvedConflicts: 0 };
  }

  const diff = computeWorkspaceBranchDiff(project, sourceBranchId);
  const sourceState = resolveBranchSnapshot(sourceBranch, project);
  const mergedScenesMap = new Map(project.scenes.map((s) => [s.id, deepClone(s)]));

  let mergedScenes = 0;
  let resolvedConflicts = 0;

  for (const srcScene of sourceState.scenes) {
    const existing = mergedScenesMap.get(srcScene.id);
    if (!existing) {
      mergedScenesMap.set(srcScene.id, deepClone(srcScene));
      mergedScenes += 1;
      continue;
    }

    const hasConflict = diff.conflicts.some((c) => c.sceneId === srcScene.id);
    if (hasConflict) {
      const choice = conflictResolutions[srcScene.id] ?? 'theirs';
      if (choice === 'theirs') {
        mergedScenesMap.set(srcScene.id, deepClone(srcScene));
        mergedScenes += 1;
      }
      resolvedConflicts += 1;
    } else if (diff.scenesModified.includes(srcScene.id)) {
      mergedScenesMap.set(srcScene.id, deepClone(srcScene));
      mergedScenes += 1;
    }
  }

  const mergeById = <T extends { id: string }>(ours: T[], theirs: T[]): T[] => {
    const map = new Map(ours.map((item) => [item.id, deepClone(item)]));
    for (const item of theirs) {
      if (!map.has(item.id)) {
        map.set(item.id, deepClone(item));
      }
    }
    return Array.from(map.values());
  };

  const nextProject: ProjectData = {
    ...project,
    scenes: Array.from(mergedScenesMap.values()),
    characters: mergeById(project.characters, sourceState.characters),
    factions: mergeById(project.factions, sourceState.factions),
    objects: mergeById(project.objects, sourceState.objects),
    outline: mergeById(project.outline, sourceState.outline),
    subplots: mergeById(project.subplots, sourceState.subplots),
    plotConnections: mergeById(
      project.plotConnections,
      sourceState.plotConnections
    ),
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedProject: {
      ...nextProject,
      branches: captureCurrentBranchSnapshot(nextProject),
    },
    mergedScenes,
    resolvedConflicts,
  };
}

/**
 * Restores a target snapshot while saving an immediate auto-backup snapshot first.
 */
export function restoreSnapshotWithAutoBackup(
  project: ProjectData,
  snapshotId: string,
  maxSnapshots = 25
): ProjectData {
  const target = project.snapshots.find((s) => s.id === snapshotId);
  if (!target || target.scenesBackup.length === 0) return project;

  const currentWords = project.scenes.reduce(
    (acc, scene) => acc + countWords(scene.content),
    0
  );
  const backupSnap: Snapshot = {
    id: `snap_autobackup_${Date.now()}`,
    branchId: project.activeBranchId,
    label: `Backup automático antes de restaurar "${target.label}"`,
    createdAt: new Date().toISOString(),
    wordCount: currentWords,
    scenesBackup: deepClone(project.scenes),
  };

  const restoredScenes = deepClone(target.scenesBackup);
  const nextProject: ProjectData = {
    ...project,
    scenes: restoredScenes,
    snapshots: [backupSnap, ...project.snapshots].slice(0, Math.max(1, maxSnapshots)),
    updatedAt: new Date().toISOString(),
  };

  return {
    ...nextProject,
    branches: captureCurrentBranchSnapshot(nextProject),
  };
}

/**
 * Safely deletes a non-active branch when at least two branches exist.
 */
export function deleteBranchSafely(
  project: ProjectData,
  branchId: string
): ProjectData {
  if (project.branches.length <= 1 || branchId === project.activeBranchId) {
    return project;
  }
  return {
    ...project,
    branches: project.branches.filter((b) => b.id !== branchId),
    updatedAt: new Date().toISOString(),
  };
}
