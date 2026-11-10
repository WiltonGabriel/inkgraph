import type { ConflictRecord, SessionCursor } from './storagePort';

export interface SyncFileEntry {
  readonly path: string;
  readonly hash: string;
  readonly updatedAt: string;
  readonly deviceName: string;
  readonly content: string;
}

export interface SyncManifest {
  readonly schemaVersion: 1;
  readonly workspaceId: string;
  readonly deviceName: string;
  readonly exportedAt: string;
  readonly sessionCursor?: SessionCursor | null;
  readonly files: SyncFileEntry[];
}

export interface SyncDeltaPlan {
  readonly toUpload: SyncFileEntry[];
  readonly toDownload: SyncFileEntry[];
  readonly conflicts: ConflictRecord[];
  readonly preferredCursor: SessionCursor | null;
}

/**
 * Pure deterministic 64-bit FNV-1a digest for browser/Node hash equivalence without node:crypto.
 */
export function computeContentDigest(content: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < content.length; i += 1) {
    const code = content.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (code + i) & 0xffff;
    h2 = Math.imul(h2, 0x01000193);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export function pickFresherSessionCursor(
  localCursor?: SessionCursor | null,
  remoteCursor?: SessionCursor | null
): SessionCursor | null {
  if (!localCursor && !remoteCursor) return null;
  if (!localCursor) return remoteCursor ?? null;
  if (!remoteCursor) return localCursor;
  return localCursor.updatedAt >= remoteCursor.updatedAt ? localCursor : remoteCursor;
}

/**
 * Computes safe multi-device sync deltas between local & remote manifests.
 * When both devices modified the same file against a known common baseline hash
 * (or modified offline with mismatched hashes), conflicts are never silently overwritten.
 */
export function computeSyncDeltaPlan(params: {
  workspaceId: string;
  localFiles: readonly SyncFileEntry[];
  remoteFiles: readonly SyncFileEntry[];
  lastSyncedHashes?: Record<string, string>;
  localCursor?: SessionCursor | null;
  remoteCursor?: SessionCursor | null;
}): SyncDeltaPlan {
  const localMap = new Map(params.localFiles.map((f) => [f.path, f]));
  const remoteMap = new Map(params.remoteFiles.map((f) => [f.path, f]));
  const baseline = params.lastSyncedHashes ?? {};
  const allPaths = new Set([...localMap.keys(), ...remoteMap.keys()]);

  const toUpload: SyncFileEntry[] = [];
  const toDownload: SyncFileEntry[] = [];
  const conflicts: ConflictRecord[] = [];

  for (const path of allPaths) {
    const local = localMap.get(path);
    const remote = remoteMap.get(path);
    const baseHash = baseline[path];

    if (local && !remote) {
      toUpload.push(local);
      continue;
    }
    if (!local && remote) {
      toDownload.push(remote);
      continue;
    }
    if (!local || !remote) continue;
    if (local.hash === remote.hash) continue;

    // Both changed since baseline, or no baseline exists and hashes diverge -> preserve both!
    const localChanged = baseHash === undefined || local.hash !== baseHash;
    const remoteChanged = baseHash === undefined || remote.hash !== baseHash;

    if (localChanged && remoteChanged) {
      conflicts.push({
        id: `conf_${Date.now().toString(36)}_${path.replace(/[^a-z0-9]/gi, '_')}`,
        workspaceId: params.workspaceId,
        entityOrSceneId: path,
        localUpdatedAt: local.updatedAt,
        remoteUpdatedAt: remote.updatedAt,
        remoteDeviceName: remote.deviceName,
        localContent: local.content,
        remoteContent: remote.content,
        createdAt: new Date().toISOString(),
      });
    } else if (localChanged) {
      toUpload.push(local);
    } else if (remoteChanged) {
      toDownload.push(remote);
    }
  }

  return {
    toUpload,
    toDownload,
    conflicts,
    preferredCursor: pickFresherSessionCursor(params.localCursor, params.remoteCursor),
  };
}
