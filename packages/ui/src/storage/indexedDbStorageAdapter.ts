import type { CatalogStoragePort, StorageBackendStatus } from '@inkgraph/domain';

const DB_NAME = 'inkgraph_vault_v1';
const STORE_NAME = 'kv';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function readLocalFallback<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocalFallback<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota overflow on legacy fallback mirror
  }
}

export class IndexedDbCatalogStorage implements CatalogStoragePort {
  private lastSyncedAt: string | null = null;
  private usingFallback = typeof indexedDB === 'undefined';

  async readJson<T>(key: string): Promise<T | null> {
    if (typeof indexedDB === 'undefined') {
      return readLocalFallback<T>(key);
    }

    try {
      const db = await openDatabase();
      const value = await new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve((getReq.result as T | undefined) ?? null);
        getReq.onerror = () => reject(getReq.error);
      });
      db.close();

      if (value !== null) {
        this.usingFallback = false;
        return value;
      }

      // Migrate legacy localStorage entry seamlessly on first read
      const migrated = readLocalFallback<T>(key);
      if (migrated !== null) {
        await this.writeJson(key, migrated);
        return migrated;
      }
      return null;
    } catch {
      this.usingFallback = true;
      return readLocalFallback<T>(key);
    }
  }

  async writeJson<T>(key: string, value: T): Promise<void> {
    this.lastSyncedAt = new Date().toISOString();
    if (typeof indexedDB === 'undefined') {
      writeLocalFallback(key, value);
      return;
    }

    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      this.usingFallback = false;
    } catch {
      this.usingFallback = true;
      writeLocalFallback(key, value);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
    if (typeof indexedDB === 'undefined') return;
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      // Ignore
    }
  }

  getStatus(): StorageBackendStatus {
    return {
      kind: this.usingFallback ? 'localstorage' : 'opfs-idb',
      persisted: !this.usingFallback,
      lastSyncedAt: this.lastSyncedAt,
    };
  }
}

export const catalogStorage = new IndexedDbCatalogStorage();
