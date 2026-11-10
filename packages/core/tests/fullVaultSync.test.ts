import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LoreDatabase, syncFullWorkspaceVault } from "../src/index";

describe("Full Vault Sync & Soft Delete", () => {
  let tempRoot: string;
  let db: LoreDatabase;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "inkgraph-vault-"));
    db = new LoreDatabase({ inMemory: true });
    for (const dir of ["lore", "manuscript", "timeline", "staging", "uploads"]) {
      mkdirSync(join(tempRoot, dir), { recursive: true });
    }
  });

  afterEach(() => {
    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("indexes lore, manuscript, timeline, staging, uploads, and records parse failures without failing", () => {
    writeFileSync(
      join(tempRoot, "lore", "elias.md"),
      [
        "---",
        "id: char_elias",
        "type: character",
        "name: Elias Vance",
        "status: canon",
        "---",
        "Protagonist.",
      ].join("\n")
    );
    writeFileSync(
      join(tempRoot, "lore", "archived.md"),
      [
        "---",
        "id: char_old",
        "type: character",
        "name: Old Character",
        "archived_at: '2026-01-01T00:00:00Z'",
        "---",
        "Archived.",
      ].join("\n")
    );
    writeFileSync(
      join(tempRoot, "lore", "broken.md"),
      "Missing YAML delimiters here!"
    );
    writeFileSync(
      join(tempRoot, "manuscript", "cap_01.md"),
      "# Neblina no Cais\n\nO navio atracou em silêncio."
    );
    writeFileSync(
      join(tempRoot, "staging", "prop_01.md"),
      "---\ntitle: Nova Facção Sugerida\nstatus: draft\n---\nTexto proposto em staging."
    );
    writeFileSync(
      join(tempRoot, "timeline", "era_01.md"),
      "# Queda do Império"
    );
    writeFileSync(
      join(tempRoot, "uploads", "mapa_notas.md"),
      "# Referência do Mapa"
    );

    const report = syncFullWorkspaceVault(tempRoot, db);

    expect(report.loreProcessed).toBe(2);
    expect(report.documentsProcessed).toBe(4);
    expect(report.errors).toHaveLength(1);
    expect(db.getParseFailures()).toHaveLength(1);

    // Default entity listing omits archived entities unless requested
    expect(db.listEntities().map((e) => e.id)).toEqual(["char_elias"]);
    expect(db.listEntities({ includeArchived: true }).map((e) => e.id)).toEqual([
      "char_elias",
      "char_old",
    ]);

    // Search works across manuscript & staging documents via FTS5
    const msHits = db.searchVaultDocuments("atracou", "manuscript");
    expect(msHits).toHaveLength(1);
    expect(msHits[0]?.section).toBe("manuscript");

    const stagingHits = db.searchVaultDocuments("proposto", "staging");
    expect(stagingHits).toHaveLength(1);
  });
});
