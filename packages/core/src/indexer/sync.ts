import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";
import { InkGraphError } from "../domain/errors";
import { parseLoreMarkdown } from "../parser/markdownParser";
import type { LoreDatabase } from "../indexer/database";

export interface SyncStats {
  readonly processed: number;
  readonly errors: { file: string; error: string }[];
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

/**
 * Recursively scans directory and syncs all markdown files into the SQLite database.
 */
export function syncWorkspaceDirectory(dirPath: string, db: LoreDatabase): SyncStats {
  let processed = 0;
  const errors: { file: string; error: string }[] = [];

  if (!existsSync(dirPath)) {
    return { processed: 0, errors: [] };
  }

  function scan(currentPath: string): void {
    const entries = readdirSync(currentPath);

    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (stat.isFile() && fullPath.endsWith(".md")) {
        try {
          const content = readFileSync(fullPath, "utf-8");
          const doc = parseLoreMarkdown(content, fullPath);
          db.upsertEntity(doc);
          processed += 1;
        } catch (err: any) {
          errors.push({
            file: fullPath,
            error: err.message ?? String(err),
          });
        }
      }
    }
  }

  scan(dirPath);
  return { processed, errors };
}
