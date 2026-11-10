import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseLoreMarkdown } from "../parser/markdownParser";
import type { LoreDatabase } from "../indexer/database";

export interface SyncStats {
  readonly processed: number;
  readonly errors: { file: string; error: string }[];
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
