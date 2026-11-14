import { describe, expect, it } from 'vitest';
import { createDemoProjectData } from '../src/data/demoProjectFactory';
import { DEFAULT_SETTINGS } from '../src/data/defaultSettings';
import {
  decryptInkpack,
  encryptInkpack,
  sanitizeSettingsForExport,
} from '../src/storage/cryptoVault';
import {
  GOOGLE_DRIVE_FREE_SCOPE,
  buildGoogleDriveAuthUrl,
  buildProjectSyncManifest,
  syncWorkspaceWithGoogleDrive,
} from '../src/storage/googleDriveSyncAdapter';
import { syncProjectWithLanHost } from '../src/storage/lanSyncClient';

describe('@inkgraph/ui Fase 1 Crypto, Drive & LAN Sync', () => {
  it('sanitizes secrets and round-trips PBKDF2-600k + AES-256-GCM .inkpack envelopes', async () => {
    const project = createDemoProjectData();
    const secretSettings = {
      ...DEFAULT_SETTINGS,
      geminiApiKey: 'AIzaSyTestSecretShouldNeverExport',
    };
    const safeSettings = sanitizeSettingsForExport(secretSettings);
    expect('geminiApiKey' in safeSettings).toBe(false);

    const envelope = await encryptInkpack(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        workspaces: [project],
        sanitizedSettings: safeSettings,
      },
      'inkgraph-passphrase-123'
    );

    expect(envelope.format).toBe('inkpack-v1');
    expect(envelope.iterations).toBe(600000);
    expect(envelope.cipher).toBe('AES-256-GCM');

    const decoded = await decryptInkpack(envelope, 'inkgraph-passphrase-123');
    expect(decoded.workspaces).toHaveLength(1);
    expect(decoded.workspaces[0]?.id).toBe(project.id);
    expect((decoded.sanitizedSettings as Record<string, unknown>)?.geminiApiKey).toBeUndefined();

    await expect(decryptInkpack(envelope, 'wrong-passphrase')).rejects.toThrow();
    await expect(
      encryptInkpack(
        { schemaVersion: 1, exportedAt: new Date().toISOString(), workspaces: [] },
        '123'
      )
    ).rejects.toThrow(/at least 6 characters/i);
  });

  it('builds Google Drive PKCE URL strictly with non-sensitive drive.file scope', () => {
    const url = new URL(
      buildGoogleDriveAuthUrl({
        clientId: 'client-123',
        redirectUri: 'http://localhost:5173/oauth',
        codeChallenge: 'challenge-xyz',
        state: 'state-abc',
      })
    );
    expect(url.searchParams.get('scope')).toBe(GOOGLE_DRIVE_FREE_SCOPE);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('syncs encrypted Markdown deltas + SessionCursor via Google Drive without uploading SQLite', async () => {
    const project = createDemoProjectData();
    const passphrase = 'sync-secret-passphrase';
    const remoteScenePath = 'manuscript/99_remoto.md';

    const remoteManifest = {
      ...buildProjectSyncManifest(project, 'Tablet', {
        lastWorkspaceId: project.id,
        lastSceneId: project.scenes[0]?.id ?? '',
        scrollRatio: 0.42,
        cursorOffset: 120,
        updatedAt: '2099-01-01T00:00:00.000Z',
        deviceName: 'Tablet',
      }),
    };
    remoteManifest.files.push({
      path: remoteScenePath,
      hash: 'remote-hash-01',
      updatedAt: '2099-01-01T00:00:00.000Z',
      deviceName: 'Tablet',
      content: '# Capítulo Extra Remoto',
    });

    const encryptedRemote = await encryptInkpack(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        workspaces: [],
        syncManifest: remoteManifest,
      } as unknown as Parameters<typeof encryptInkpack>[0],
      passphrase
    );

    let uploadedPayload = '';
    const mockFetch: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      if (urlStr.includes('/drive/v3/files?')) {
        return new Response(
          JSON.stringify({ files: [{ id: 'drive-file-1', name: 'manifest.json' }] }),
          { status: 200 }
        );
      }
      if (urlStr.includes('/drive/v3/files/drive-file-1?alt=media')) {
        return new Response(JSON.stringify(encryptedRemote), { status: 200 });
      }
      if (urlStr.includes('/upload/drive/v3/files/drive-file-1')) {
        uploadedPayload = String(init?.body ?? '');
        return new Response(JSON.stringify({ id: 'drive-file-1' }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await syncWorkspaceWithGoogleDrive({
      accessToken: 'token-abc',
      project,
      deviceName: 'Desktop',
      sessionCursor: {
        lastWorkspaceId: project.id,
        lastSceneId: project.scenes[0]?.id ?? '',
        scrollRatio: 0.1,
        cursorOffset: 10,
        updatedAt: '2025-01-01T00:00:00.000Z',
        deviceName: 'Desktop',
      },
      encryptionPassphrase: passphrase,
      fetchFn: mockFetch,
    });

    expect(res.remoteManifestFound).toBe(true);
    expect(res.uploadedManifestId).toBe('drive-file-1');
    expect(res.delta.toDownload.some((f) => f.path === remoteScenePath)).toBe(true);
    expect(res.delta.preferredCursor?.deviceName).toBe('Tablet');
    expect(uploadedPayload).not.toContain('.sqlite');
    expect(uploadedPayload).toContain('inkpack-v1');
  });

  it('syncs cleanly over LAN host endpoint with Bearer token', async () => {
    const project = createDemoProjectData();
    const calls: { url: string; auth?: string; method?: string }[] = [];

    const mockFetch: typeof fetch = async (input, init) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      calls.push({
        url: String(input),
        auth: headers.Authorization,
        method: init?.method ?? 'GET',
      });
      if (String(input).endsWith('/sync/manifest')) {
        return new Response(
          JSON.stringify({
            schemaVersion: 1,
            workspaceId: project.id,
            deviceName: 'HostPC',
            exportedAt: new Date().toISOString(),
            sessionCursor: null,
            files: [],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ applied: 3, conflictsStaged: 0 }), { status: 200 });
    };

    const result = await syncProjectWithLanHost({
      hostUrl: 'http://192.168.1.40:3333/',
      bearerToken: 'lan-token-secret',
      project,
      deviceName: 'Celular',
      sessionCursor: null,
      fetchFn: mockFetch,
    });

    expect(calls[0]?.url).toBe('http://192.168.1.40:3333/sync/manifest');
    expect(calls[0]?.auth).toBe('Bearer lan-token-secret');
    expect(calls[1]?.method).toBe('POST');
    expect(result.appliedToHost).toBe(3);
    expect(result.conflictsStagedOnHost).toBe(0);
  });
});
