import { writeFileSync } from "node:fs";
import type { ChangeSetProvenance } from "@inkgraph/core";

export interface StoredChangeSetRecord {
  readonly provenance: ChangeSetProvenance;
  readonly filePath: string;
  readonly previousContent: string;
  readonly expiresAtMs: number;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * In-memory bounded journal of recent agent direct edits enabling 1-click 24h undo.
 */
export class McpChangeSetStore {
  private readonly byUndoId = new Map<string, StoredChangeSetRecord>();
  private readonly sceneVersions = new Map<string, number>();

  public getSceneVersion(sceneId: string): number {
    return this.sceneVersions.get(sceneId) ?? 1;
  }

  public bumpSceneVersion(sceneId: string): number {
    const next = this.getSceneVersion(sceneId) + 1;
    this.sceneVersions.set(sceneId, next);
    return next;
  }

  public record(
    provenance: ChangeSetProvenance,
    filePath: string,
    previousContent: string
  ): void {
    this.pruneExpired();
    this.byUndoId.set(provenance.undoId, {
      provenance,
      filePath,
      previousContent,
      expiresAtMs: Date.now() + TWENTY_FOUR_HOURS_MS,
    });
  }

  public listRecent(): ChangeSetProvenance[] {
    this.pruneExpired();
    return Array.from(this.byUndoId.values()).map((r) => r.provenance);
  }

  public undo(undoId: string): StoredChangeSetRecord | null {
    this.pruneExpired();
    const record = this.byUndoId.get(undoId);
    if (!record) return null;
    writeFileSync(record.filePath, record.previousContent, "utf-8");
    this.bumpSceneVersion(record.provenance.targetId);
    this.byUndoId.delete(undoId);
    return record;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [id, entry] of this.byUndoId.entries()) {
      if (entry.expiresAtMs <= now) {
        this.byUndoId.delete(id);
      }
    }
  }
}
