export interface SessionCursor {
  readonly lastWorkspaceId: string;
  readonly lastView: string;
  readonly lastSceneId: string | null;
  readonly scrollRatio: number;
  readonly paragraphAnchor?: string;
  readonly deviceName: string;
  readonly updatedAt: string;
}

export interface ConflictRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly entityOrSceneId: string;
  readonly localUpdatedAt: string;
  readonly remoteUpdatedAt: string;
  readonly remoteDeviceName: string;
  readonly localContent: string;
  readonly remoteContent: string;
  readonly createdAt: string;
}

export interface StorageBackendStatus {
  readonly kind: "opfs-idb" | "localstorage" | "host-vault" | "tauri-ipc";
  readonly persisted: boolean;
  readonly lastSyncedAt: string | null;
}

/**
 * Platform-independent persistence port allowing Browser/PWA (IndexedDB/OPFS),
 * Tauri Desktop/Mobile IPC, and local filesystem bridges to share one contract.
 */
export interface CatalogStoragePort {
  readJson<T>(key: string): Promise<T | null>;
  writeJson<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  getStatus(): StorageBackendStatus;
}
