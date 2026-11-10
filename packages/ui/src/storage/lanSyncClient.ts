import { computeSyncDeltaPlan, type SessionCursor, type SyncManifest } from '@inkgraph/domain';
import type { ProjectData } from '../types/project';
import { buildProjectSyncManifest } from './googleDriveSyncAdapter';

export interface LanSyncResult {
  readonly appliedToHost: number;
  readonly conflictsStagedOnHost: number;
  readonly downloadedFromHost: number;
  readonly preferredCursor: SessionCursor | null;
}

/**
 * Pairs with a host PC running InkGraph MCP/Sync over Wi-Fi or Tailscale.
 */
export async function syncProjectWithLanHost(params: {
  hostUrl: string;
  bearerToken?: string;
  project: ProjectData;
  deviceName: string;
  sessionCursor: SessionCursor | null;
  lastSyncedHashes?: Record<string, string>;
  fetchFn?: typeof fetch;
}): Promise<LanSyncResult> {
  const fetchFn = params.fetchFn ?? fetch;
  const baseUrl = params.hostUrl.replace(/\/+$/, '');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.bearerToken?.trim()) {
    headers.Authorization = `Bearer ${params.bearerToken.trim()}`;
  }

  const manifestRes = await fetchFn(`${baseUrl}/sync/manifest`, { headers });
  if (!manifestRes.ok) {
    throw new Error(`LAN host unreachable (HTTP ${manifestRes.status}).`);
  }
  const remoteManifest = (await manifestRes.json()) as SyncManifest;
  const localManifest = buildProjectSyncManifest(
    params.project,
    params.deviceName,
    params.sessionCursor
  );

  const delta = computeSyncDeltaPlan({
    workspaceId: params.project.id,
    localFiles: localManifest.files,
    remoteFiles: remoteManifest.files,
    lastSyncedHashes: params.lastSyncedHashes,
    localCursor: params.sessionCursor,
    remoteCursor: remoteManifest.sessionCursor,
  });

  const pushRes = await fetchFn(`${baseUrl}/sync/push`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      files: localManifest.files,
      lastSyncedHashes: params.lastSyncedHashes,
      sessionCursor: delta.preferredCursor,
    }),
  });
  if (!pushRes.ok) {
    throw new Error(`LAN sync push failed (HTTP ${pushRes.status}).`);
  }
  const pushData = (await pushRes.json()) as {
    applied: number;
    conflictsStaged: number;
  };

  return {
    appliedToHost: pushData.applied,
    conflictsStagedOnHost: pushData.conflictsStaged,
    downloadedFromHost: delta.toDownload.length,
    preferredCursor: delta.preferredCursor,
  };
}
