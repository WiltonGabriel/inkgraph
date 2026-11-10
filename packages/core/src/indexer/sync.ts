import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";
import {
  InkGraphError,
  parseLoreMarkdown,
  parseVaultDocument,
  type VaultSection,
} from "@inkgraph/domain";
import type { LoreDatabase } from "./database";

export interface SyncStats {
  readonly processed: number;
  readonly errors: { file: string; error: string }[];
}

export interface FullVaultSyncReport {
  readonly loreProcessed: number;
  readonly documentsProcessed: number;
  readonly errors: { file: string; section: VaultSection; error: string }[];
}

/**
 * Validates and resolves a target filename strictly inside the staging directory.
 * Rejects path traversal ('..') or directory separators ('/', '\\') with 'canon_violation'.
 */
export function resolveSafeStagingPath(stagingDir: string, rawFilename: string): string {
  const trimmed = rawFilename.trim();
  if (
    !trimmed ||
    trimmed.includes("..") ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0")
  ) {
    throw new InkGraphError(
      "canon_violation",
      "Path traversal or directory separator in staging filename is forbidden.",
      { filename: rawFilename }
    );
  }

  const base = basename(trimmed);
  const safeFilename = base.endsWith(".md") ? base : `${base}.md`;
  const resolvedStaging = resolve(stagingDir);
  const resolvedTarget = resolve(resolvedStaging, safeFilename);

  if (!resolvedTarget.startsWith(resolvedStaging + sep)) {
    throw new InkGraphError(
      "canon_violation",
      "Target path escapes the staging directory boundary.",
      { filename: rawFilename, resolvedTarget }
    );
  }

  return resolvedTarget;
}

function collectMarkdownFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  const results: string[] = [];

  function walk(currentPath: string): void {
    const entries = readdirSync(currentPath);
    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && fullPath.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }

  walk(dirPath);
  return results;
}

/**
 * Recursively scans a lore directory and syncs entity Markdown files into SQLite.
 */
export function syncWorkspaceDirectory(dirPath: string, db: LoreDatabase): SyncStats {
  let processed = 0;
  const errors: { file: string; error: string }[] = [];

  for (const fullPath of collectMarkdownFiles(dirPath)) {
    try {
      const content = readFileSync(fullPath, "utf-8");
      const doc = parseLoreMarkdown(content, fullPath);
      db.upsertEntity(doc);
      processed += 1;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ file: fullPath, error: message });
    }
  }

  return { processed, errors };
}

const NON_LORE_SECTIONS: readonly { dir: string; section: VaultSection }[] = [
  { dir: "manuscript", section: "manuscript" },
  { dir: "timeline", section: "timeline" },
  { dir: "staging", section: "staging" },
  { dir: "uploads", section: "uploads" },
];

/**
 * Indexes all workspace subdirectories (`lore/`, `shared-lore/`, `manuscript/`,
 * `timeline/`, `staging/`, `uploads/`) without dropping broken files silently.
 */
export function syncFullWorkspaceVault(
  workspaceRoot: string,
  db: LoreDatabase,
  options?: { sharedSeriesDir?: string }
): FullVaultSyncReport {
  db.clearParseFailures();

  let loreProcessed = 0;
  let documentsProcessed = 0;
  const allErrors: FullVaultSyncReport["errors"] = [];

  const loreDirs: { path: string; section: VaultSection }[] = [
    { path: join(workspaceRoot, "lore"), section: "lore" },
  ];
  if (options?.sharedSeriesDir) {
    loreDirs.unshift({ path: options.sharedSeriesDir, section: "series" });
  }

  for (const dirEntry of loreDirs) {
    const stats = syncWorkspaceDirectory(dirEntry.path, db);
    loreProcessed += stats.processed;
    for (const err of stats.errors) {
      const failure = { file: err.file, section: dirEntry.section, error: err.error };
      allErrors.push(failure);
      db.recordParseFailure({
        filePath: err.file,
        section: dirEntry.section,
        error: err.error,
      });
    }
  }

  for (const target of NON_LORE_SECTIONS) {
    const sectionDir = join(workspaceRoot, target.dir);
    for (const fullPath of collectMarkdownFiles(sectionDir)) {
      try {
        const content = readFileSync(fullPath, "utf-8");
        const doc = parseVaultDocument(content, fullPath, target.section);
        db.upsertVaultDocument(doc);
        documentsProcessed += 1;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        allErrors.push({ file: fullPath, section: target.section, error: message });
        db.recordParseFailure({
          filePath: fullPath,
          section: target.section,
          error: message,
        });
      }
    }
  }

  return {
    loreProcessed,
    documentsProcessed,
    errors: allErrors,
  };
}
