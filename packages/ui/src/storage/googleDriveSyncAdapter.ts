import {
  computeContentDigest,
  computeSyncDeltaPlan,
  type SessionCursor,
  type SyncDeltaPlan,
  type SyncFileEntry,
  type SyncManifest,
} from '@inkgraph/domain';
import type { ProjectData } from '../types/project';
import { buildMarkdownVaultFiles } from './vaultFolderExport';
import { decryptInkpack, encryptInkpack, type InkpackEnvelope } from './cryptoVault';

/**
 * Restricted non-sensitive scope: only accesses files created/opened by InkGraph.
 * Avoids paid CASA audits and guarantees user-owned $0 Google Drive storage.
 */
export const GOOGLE_DRIVE_FREE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const SYNC_MANIFEST_FILENAME = 'inkgraph-sync-manifest.json';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function createPkceChallengePair(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const randomBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const verifier = bytesToBase64Url(randomBytes);
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );
  const challenge = bytesToBase64Url(new Uint8Array(digest));
  return { verifier, challenge };
}

export function buildGoogleDriveAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_DRIVE_FREE_SCOPE);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', params.state);
  return url.toString();
}

export function buildProjectSyncManifest(
  project: ProjectData,
  deviceName: string,
  sessionCursor: SessionCursor | null
): SyncManifest {
  const vaultFiles = buildMarkdownVaultFiles(project);
  const files: SyncFileEntry[] = vaultFiles.map((f) => ({
    path: f.relativePath,
    hash: computeContentDigest(f.content),
    updatedAt: project.updatedAt,
    deviceName,
    content: f.content,
  }));

  return {
    schemaVersion: 1,
    workspaceId: project.id,
    deviceName,
    exportedAt: new Date().toISOString(),
    sessionCursor,
    files,
  };
}

/**
 * Syncs Markdown deltas + SessionCursor against Google Drive (`drive.file` folder),
 * optionally wrapping the payload in PBKDF2+AES-256-GCM encryption.
 * Never uploads SQLite database files.
 */
export async function syncWorkspaceWithGoogleDrive(params: {
  accessToken: string;
  project: ProjectData;
  deviceName: string;
  sessionCursor: SessionCursor | null;
  lastSyncedHashes?: Record<string, string>;
  encryptionPassphrase?: string;
  fetchFn?: typeof fetch;
}): Promise<{
  delta: SyncDeltaPlan;
  uploadedManifestId: string;
  remoteManifestFound: boolean;
}> {
  const fetchFn = params.fetchFn ?? fetch;
  const manifestName = `${params.project.id}_${SYNC_MANIFEST_FILENAME}`;
  const authHeader = { Authorization: `Bearer ${params.accessToken}` };

  const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
  searchUrl.searchParams.set('q', `name='${manifestName}' and trashed=false`);
  searchUrl.searchParams.set('fields', 'files(id,name,modifiedTime)');

  const listRes = await fetchFn(searchUrl.toString(), { headers: authHeader });
  if (!listRes.ok) {
    throw new Error(`Google Drive list failed (HTTP ${listRes.status}).`);
  }
  const listData = (await listRes.json()) as { files?: { id: string; name: string }[] };
  const existingFile = listData.files?.[0];

  let remoteManifest: SyncManifest | null = null;
  if (existingFile) {
    const dlRes = await fetchFn(
      `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
      { headers: authHeader }
    );
    if (dlRes.ok) {
      const rawJson = (await dlRes.json()) as SyncManifest | InkpackEnvelope;
      if ('format' in rawJson && rawJson.format === 'inkpack-v1') {
        if (!params.encryptionPassphrase) {
          throw new Error('Remote Drive sync manifest is encrypted; passphrase is required.');
        }
        const decrypted = await decryptInkpack(rawJson, params.encryptionPassphrase);
        remoteManifest = (decrypted as unknown as { syncManifest?: SyncManifest }).syncManifest ?? null;
      } else {
        remoteManifest = rawJson as SyncManifest;
      }
    }
  }

  const localManifest = buildProjectSyncManifest(
    params.project,
    params.deviceName,
    params.sessionCursor
  );
  const delta = computeSyncDeltaPlan({
    workspaceId: params.project.id,
    localFiles: localManifest.files,
    remoteFiles: remoteManifest?.files ?? [],
    lastSyncedHashes: params.lastSyncedHashes,
    localCursor: params.sessionCursor,
    remoteCursor: remoteManifest?.sessionCursor ?? null,
  });

  // Merge non-conflicting downloaded files with local manifest for upload
  const mergedMap = new Map(localManifest.files.map((f) => [f.path, f]));
  for (const dl of delta.toDownload) {
    mergedMap.set(dl.path, dl);
  }
  const updatedManifest: SyncManifest = {
    ...localManifest,
    sessionCursor: delta.preferredCursor,
    files: Array.from(mergedMap.values()),
  };

  let uploadContent: string;
  if (params.encryptionPassphrase) {
    const wrapped = await encryptInkpack(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        workspaces: [],
        syncManifest: updatedManifest,
      } as unknown as Parameters<typeof encryptInkpack>[0],
      params.encryptionPassphrase
    );
    uploadContent = JSON.stringify(wrapped);
  } else {
    uploadContent = JSON.stringify(updatedManifest);
  }

  const boundary = `inkgraph_${Date.now()}`;
  const metadata = JSON.stringify({
    name: manifestName,
    mimeType: 'application/json',
    appProperties: { inkgraphWorkspaceId: params.project.id },
  });
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    uploadContent,
    `--${boundary}--`,
  ].join('\r\n');

  const uploadUrl = existingFile
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const uploadRes = await fetchFn(uploadUrl, {
    method: existingFile ? 'PATCH' : 'POST',
    headers: {
      ...authHeader,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!uploadRes.ok) {
    throw new Error(`Google Drive upload failed (HTTP ${uploadRes.status}).`);
  }
  const uploaded = (await uploadRes.json()) as { id: string };

  return {
    delta,
    uploadedManifestId: uploaded.id,
    remoteManifestFound: Boolean(existingFile),
  };
}
