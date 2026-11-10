import { existsSync, watch, type FSWatcher } from "node:fs";
import type { LoreDatabase } from "./database";
import { syncFullWorkspaceVault, type FullVaultSyncReport } from "./sync";

export interface VaultWatcherOptions {
  readonly workspaceRoot: string;
  readonly sharedSeriesDir?: string;
  readonly debounceMs?: number;
  readonly onSync?: (report: FullVaultSyncReport) => void;
  readonly onError?: (err: unknown) => void;
}

/**
 * Debounced filesystem watcher keeping the ephemeral SQLite index synchronized
 * whenever Markdown files inside `./workspace/` change externally.
 */
export class WorkspaceVaultWatcher {
  private watcher: FSWatcher | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;

  constructor(
    private readonly db: LoreDatabase,
    private readonly options: VaultWatcherOptions
  ) {
    this.debounceMs = options.debounceMs ?? 250;
  }

  public start(): FullVaultSyncReport {
    const initial = this.syncNow();
    if (existsSync(this.options.workspaceRoot)) {
      this.watcher = watch(
        this.options.workspaceRoot,
        { recursive: true },
        (_eventType, filename) => {
          if (filename && !filename.endsWith(".md")) return;
          this.scheduleSync();
        }
      );
      this.watcher.on("error", (err) => this.options.onError?.(err));
    }
    return initial;
  }

  private scheduleSync(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      try {
        const report = this.syncNow();
        this.options.onSync?.(report);
      } catch (err) {
        this.options.onError?.(err);
      }
    }, this.debounceMs);
  }

  public syncNow(): FullVaultSyncReport {
    return syncFullWorkspaceVault(this.options.workspaceRoot, this.db, {
      sharedSeriesDir: this.options.sharedSeriesDir,
    });
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.watcher?.close();
    this.watcher = null;
  }
}
