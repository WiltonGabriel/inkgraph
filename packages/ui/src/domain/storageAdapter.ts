import type { AppSettings, ProjectData } from '../types/project';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { createDemoProjectData } from '../data/demoProjectFactory';
import { normalizeWorkspaceData } from './workspaceNormalizer';

export const STORAGE_KEY_CATALOG = 'inkgraph_workspaces_catalog_v3';
export const STORAGE_KEY_ACTIVE_ID = 'inkgraph_active_workspace_id_v3';
export const STORAGE_KEY_LEGACY_PROJECT = 'inkgraph_project_v2';
export const STORAGE_KEY_SETTINGS = 'inkgraph_settings_v2';

const IDB_NAME = 'inkgraph_assets_db';
const IDB_STORE_MAPS = 'map_assets';
const IDB_VERSION = 1;

export interface StoredMapRecord {
  id: string;
  worldId: string;
  dataUrl: string;
  byteSize: number;
  updatedAt: string;
}

export interface StorageVerificationResult {
  ok: boolean;
  verifiedAt: string;
  sizeKb: number;
  workspaceCount: number;
  sceneCount: number;
  error?: string;
}

/**
 * Merges persisted program preferences cleanly over current defaults so new
 * settings keys never break existing browser storage snapshots.
 */
export function loadSettingsFromStorage(
  defaults: AppSettings = DEFAULT_SETTINGS
): AppSettings {
  try {
    if (typeof localStorage === 'undefined') return defaults;
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved) as Partial<AppSettings>;
    return {
      ...defaults,
      ...parsed,
      shortcuts: {
        ...defaults.shortcuts,
        ...(parsed.shortcuts ?? {}),
      },
      sidebarCollapsedGroups: {
        ...defaults.sidebarCollapsedGroups,
        ...(parsed.sidebarCollapsedGroups ?? {}),
      },
      hiddenSidebarViews: Array.isArray(parsed.hiddenSidebarViews)
        ? parsed.hiddenSidebarViews
        : defaults.hiddenSidebarViews,
    };
  } catch {
    return defaults;
  }
}

/** Persists committed program settings synchronously. */
export function saveSettingsToStorage(settings: AppSettings): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/** Loads workspace catalog with migration from legacy v2 single-project storage. */
export function loadCatalogFromStorage(): ProjectData[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const savedCatalog = localStorage.getItem(STORAGE_KEY_CATALOG);
      if (savedCatalog) {
        const parsed = JSON.parse(savedCatalog);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .map((item) => normalizeWorkspaceData(item))
            .filter((item): item is ProjectData => item !== null);
          if (normalized.length > 0) return normalized;
        }
      }
      const legacySingle = localStorage.getItem(STORAGE_KEY_LEGACY_PROJECT);
      if (legacySingle) {
        const normalizedSingle = normalizeWorkspaceData(JSON.parse(legacySingle));
        if (normalizedSingle) {
          return [{ ...normalizedSingle, isFavorite: true, folderOrTag: 'Principal' }];
        }
      }
    }
  } catch {
    // Fallback to initial seed workspace
  }

  const demo = createDemoProjectData();
  return [
    {
      ...demo,
      isFavorite: true,
      folderOrTag: 'Série Principal',
      accentColor: '#3b82f6',
      lastOpenedAt: new Date().toISOString(),
    },
  ];
}

export function loadActiveWorkspaceIdFromStorage(): string {
  try {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || '';
  } catch {
    return '';
  }
}

let pendingSaveTimer: ReturnType<typeof setTimeout> | null = null;
let latestCatalogRef: { workspaces: ProjectData[]; activeId: string } | null = null;

/** Flushes queued catalog snapshot to localStorage immediately. */
export function flushCatalogSave(): boolean {
  if (pendingSaveTimer !== null) {
    clearTimeout(pendingSaveTimer);
    pendingSaveTimer = null;
  }
  if (!latestCatalogRef || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(latestCatalogRef.workspaces));
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, latestCatalogRef.activeId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounces catalog persistence during active typing so keystrokes stay fluid
 * without redundant double serialization on every character.
 */
export function scheduleCatalogSave(
  workspaces: ProjectData[],
  activeId: string,
  delayMs = 350
): void {
  latestCatalogRef = { workspaces, activeId };
  if (pendingSaveTimer !== null) {
    clearTimeout(pendingSaveTimer);
  }
  pendingSaveTimer = setTimeout(() => {
    flushCatalogSave();
  }, delayMs);
}

/**
 * Synchronously writes current workspaces & settings, then reads back from
 * storage and verifies structural integrity so the Save button performs a real check.
 */
export function verifyAndReloadStorage(
  expectedWorkspaces: ProjectData[],
  activeId: string,
  expectedSettings: AppSettings
): StorageVerificationResult {
  const verifiedAt = new Date().toLocaleTimeString('pt-BR');
  try {
    if (typeof localStorage === 'undefined') {
      return {
        ok: false,
        verifiedAt,
        sizeKb: 0,
        workspaceCount: 0,
        sceneCount: 0,
        error: 'localStorage indisponível no ambiente atual.',
      };
    }

    latestCatalogRef = { workspaces: expectedWorkspaces, activeId };
    flushCatalogSave();
    const settingsSaved = saveSettingsToStorage(expectedSettings);
    if (!settingsSaved) {
      return {
        ok: false,
        verifiedAt,
        sizeKb: 0,
        workspaceCount: 0,
        sceneCount: 0,
        error: 'Falha ao gravar configurações no armazenamento local.',
      };
    }

    const rawCatalog = localStorage.getItem(STORAGE_KEY_CATALOG);
    const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!rawCatalog || !rawSettings) {
      return {
        ok: false,
        verifiedAt,
        sizeKb: 0,
        workspaceCount: 0,
        sceneCount: 0,
        error: 'Leitura pós-gravação retornou vazia.',
      };
    }

    const reloadedCatalog = JSON.parse(rawCatalog) as ProjectData[];
    const reloadedSettings = JSON.parse(rawSettings) as AppSettings;

    const catalogOk =
      Array.isArray(reloadedCatalog) &&
      reloadedCatalog.length === expectedWorkspaces.length &&
      reloadedCatalog.every((ws, idx) => {
        const exp = expectedWorkspaces[idx];
        return ws.id === exp.id && (ws.scenes?.length ?? 0) === exp.scenes.length;
      });

    const settingsOk =
      reloadedSettings.language === expectedSettings.language &&
      reloadedSettings.theme === expectedSettings.theme &&
      reloadedSettings.shortcuts?.commandPalette === expectedSettings.shortcuts.commandPalette;

    const totalScenes = reloadedCatalog.reduce(
      (sum, ws) => sum + (ws.scenes?.length ?? 0),
      0
    );
    const sizeKb = Math.max(
      1,
      Math.round((rawCatalog.length + rawSettings.length) / 1024)
    );

    if (!catalogOk || !settingsOk) {
      return {
        ok: false,
        verifiedAt,
        sizeKb,
        workspaceCount: reloadedCatalog.length,
        sceneCount: totalScenes,
        error: 'Inconsistência detectada ao reler o snapshot salvo.',
      };
    }

    return {
      ok: true,
      verifiedAt,
      sizeKb,
      workspaceCount: reloadedCatalog.length,
      sceneCount: totalScenes,
    };
  } catch (err) {
    return {
      ok: false,
      verifiedAt,
      sizeKb: 0,
      workspaceCount: 0,
      sceneCount: 0,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao verificar.',
    };
  }
}

function openAssetsDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_MAPS)) {
          db.createObjectStore(IDB_STORE_MAPS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Persists a large map image/SVG asset inside IndexedDB to protect localStorage limits. */
export async function saveMapAssetDataUrl(
  id: string,
  worldId: string,
  dataUrl: string
): Promise<boolean> {
  const db = await openAssetsDb();
  if (!db) return false;
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE_MAPS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_MAPS);
    const record: StoredMapRecord = {
      id,
      worldId,
      dataUrl,
      byteSize: dataUrl.length,
      updatedAt: new Date().toISOString(),
    };
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      resolve(false);
    };
  });
}

/** Reads a map image/SVG asset data URL from IndexedDB. */
export async function getMapAssetDataUrl(id: string): Promise<string | null> {
  const db = await openAssetsDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE_MAPS, 'readonly');
    const req = tx.objectStore(IDB_STORE_MAPS).get(id);
    req.onsuccess = () => {
      db.close();
      const rec = req.result as StoredMapRecord | undefined;
      resolve(rec?.dataUrl ?? null);
    };
    req.onerror = () => {
      db.close();
      resolve(null);
    };
  });
}

/** Deletes a stored map asset from IndexedDB. */
export async function deleteMapAssetData(id: string): Promise<void> {
  const db = await openAssetsDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(IDB_STORE_MAPS, 'readwrite');
    tx.objectStore(IDB_STORE_MAPS).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      resolve();
    };
  });
}

/** Summarizes IndexedDB map asset count and approximate KB usage for diagnostics. */
export async function getAssetStoreDiagnostics(): Promise<{
  mapAssetCount: number;
  assetStoreKb: number;
}> {
  const db = await openAssetsDb();
  if (!db) return { mapAssetCount: 0, assetStoreKb: 0 };
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE_MAPS, 'readonly');
    const req = tx.objectStore(IDB_STORE_MAPS).getAll();
    req.onsuccess = () => {
      db.close();
      const rows = Array.isArray(req.result) ? (req.result as StoredMapRecord[]) : [];
      const totalBytes = rows.reduce((sum, r) => sum + (r.byteSize || 0), 0);
      resolve({
        mapAssetCount: rows.length,
        assetStoreKb: Math.round(totalBytes / 1024),
      });
    };
    req.onerror = () => {
      db.close();
      resolve({ mapAssetCount: 0, assetStoreKb: 0 });
    };
  });
}
