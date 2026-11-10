import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LoreDatabase } from "../src/indexer/database";
import { parseLoreMarkdown } from "../src/parser/markdownParser";

describe("LoreDatabase Indexer (SQLite + FTS5)", () => {
  let db: LoreDatabase;

  beforeEach(() => {
    db = new LoreDatabase({ inMemory: true });
  });

  afterEach(() => {
    db.close();
  });

  it("should index and retrieve entity by ID and alias", () => {
    const markdown = `---
id: "char_morrigan"
type: "character"
name: "Morrigan Crow"
aliases: ["The Shadow Queen", "Night Sovereign"]
status: "canon"
tags: ["royalty", "necromancy"]
relationships:
  - target: "faction_iron_order"
    relation: "sworn_enemy"
    sentiment: -0.9
epistemic:
  secrets_kept:
    - "Possesses the Soul Obsidian"
  known_by:
    - "self"
---
Queen of the Northern Crags.
`;

    const doc = parseLoreMarkdown(markdown, "workspace/lore/characters/morrigan.md");
    db.upsertEntity(doc);

    // Query by exact ID
    const byId = db.getEntityByIdOrAlias("char_morrigan");
    expect(byId).not.toBeNull();
    expect(byId?.name).toBe("Morrigan Crow");
    expect(byId?.epistemic.secrets_kept).toContain("Possesses the Soul Obsidian");

    // Query by Alias
    const byAlias = db.getEntityByIdOrAlias("The Shadow Queen");
    expect(byAlias).not.toBeNull();
    expect(byAlias?.id).toBe("char_morrigan");

    // Query relationships
    const rels = db.getAllRelationships();
    expect(rels).toHaveLength(1);
    expect(rels[0]?.relation).toBe("sworn_enemy");
    expect(rels[0]?.sentiment).toBe(-0.9);
  });

  it("should search entities via full-text search (FTS5)", () => {
    const doc1 = parseLoreMarkdown(`---
id: "item_obsidian"
type: "item"
name: "Soul Obsidian"
aliases: []
status: "canon"
tags: ["relic"]
---
A legendary black stone capable of storing cognitive signatures.
`);

    db.upsertEntity(doc1);

    const results = db.search("cognitive");
    expect(results).toHaveLength(1);
    expect(results[0]?.entity_id).toBe("item_obsidian");
  });
});
